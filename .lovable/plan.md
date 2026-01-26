
Objectif
- Faire apparaître correctement dans l’onglet **Données → Invest** les 2 lignes manquantes du devis Cybertek :
  1) **Synology Kit Rails coulissants RKS-02** (QTE 2, Total 216,00 €)
  2) **Installation** avec la désignation complète (QTE 2, Total 974,00 €)
- Rendre le parser plus robuste aux variations d’extraction PDF (colonnes concaténées, montants pas forcément en “fin de ligne”, QTE et montant séparés sur 2 lignes, etc.).
- Ajouter un mode debug “sans devtools” pour voir ce que le parser voit (afin d’arrêter les itérations à l’aveugle).

Constat (à partir de votre capture)
- Le tableau PDF contient bien 5 lignes “métier” :
  - D4EC-2666-16G (ok)
  - RX1217RP (ok)
  - RKS-02 (manquante)
  - HAT5320-8T (ok)
  - Installation (manquante)
  - Frais de livraison (souvent à 0,00 — pas forcément critique mais idéalement présent)
- Le code actuel du parser Cybertek dépend fortement de regex “fin de ligne” (`… €\s*$`) :
  - `rowEndRegex` pour les produits
  - `lineEndPattern` / `amountOnlyMatch` pour Installation/Frais
- Or l’extraction pdfjs peut produire des lignes où :
  - le montant n’est pas le dernier token de la ligne (donc `\s*$` échoue)
  - la QTE et le montant sont séparés sur 2 lignes
  - la ligne “Installation” peut être isolée (REF seul), puis la désignation et les chiffres apparaissent ensuite

Hypothèses techniques les plus probables (racines)
1) “Kit Rails RKS-02” n’est pas détectée car la regex de fin de ligne ne matche pas (montant pas en fin de ligne) OU le backtracking (`findSyRefIndexBackwards`) remonte trop peu (fenêtre de 8 lignes) sur ce produit.
2) “Installation” n’est pas détectée car :
   - `specialRefMatch` ne se déclenche pas (le texte de la ligne ne “commence” pas par Installation à cause d’un préfixe / alignement)
   - OU `lineEndPattern` ne matche jamais car “2 974,00 €” n’est pas sous la forme attendue sur une seule ligne (ou pas en fin de ligne)
   - OU la QTE et le montant sont fragmentés sur des lignes différentes.

Solution proposée (robuste, en 3 couches)
A) Rendre la détection “montant de ligne” tolérante (ne plus dépendre de la fin de ligne)
Fichier : `src/lib/pdf-import-parser.ts`

1) Produits standards (SY-…)
- Modifier `rowEndRegex` pour qu’il puisse matcher même si le `€` n’est pas en fin de ligne :
  - Passer d’un match “ancré fin de ligne” à un match “dans la ligne”, puis sélectionner le **dernier** couple (QTE, montant) trouvé sur la ligne.
- Ajuster le calcul de `leftPart` (désignation) :
  - Au lieu de `lastIndexOf(endMatch[0])` basé sur un match ancré, utiliser l’index réel du match retenu (idéalement via `matchAll` + `index`) afin de couper proprement avant la zone chiffres.
- Étendre la fenêtre de backtracking `findSyRefIndexBackwards` :
  - passer de 8 à ~15 lignes (ou “jusqu’au stop marker”), car le bloc “Kit Rails” peut être plus “étalé” (images + retours à la ligne).
- Conserver le garde-fou anti-fusion (stopper si on recroise une ligne contenant `€`) mais le baser de préférence sur un pattern “QTE+montant” plutôt que tout `€` si ça devient trop agressif.

Impact attendu :
- La ligne SY-RKS02 / RKS-02 redevient détectable même si la ligne QTE+Total n’est pas parfaitement formatée.

2) Services (Installation / Frais de livraison)
- Remplacer la détection `startsWith("Installation")` par une regex plus permissive en début de ligne :
  - `^\s*Installation\b` et `^\s*Frais de livraison\b`
  - (pour absorber d’éventuels espaces, caractères invisibles, ou préfixes mineurs)
- Remplacer `lineEndPattern` et `amountOnlyMatch` (actuellement plutôt ancrés fin de ligne) par une recherche “dernier montant € de la ligne” :
  - Rechercher tous les tokens monétaires présents sur chaque ligne de la fenêtre, prendre le dernier.
  - Essayer d’extraire la QTE juste avant ce token (si la ligne contient “2 974,00 €”).
- Ajouter une gestion “QTE sur une ligne, montant sur la suivante” (cas fréquent en extraction) :
  - Si une ligne est uniquement `^\s*\d{1,2}\s*$` et la suivante contient un montant `€`, combiner en (QTE, montant).

B) Ajouter un “recovery pass” ciblé si les lignes restent absentes
Fichier : `src/lib/pdf-import-parser.ts`

Même après A), il peut rester des cas où la structure est trop fragmentée. Pour stopper les allers-retours, on ajoute un fallback final :

1) Recovery “Installation”
- Si `result.lignes` ne contient aucune référence “Installation” :
  - Scanner `lines` (le document entier) à la recherche de la première occurrence de `Installation` (ligne exacte OU ligne contenant “Installation” seule dans la colonne REF reconstruite).
  - Construire une fenêtre de 15–25 lignes après cette occurrence :
    - Récupérer la désignation “Prestation d’installation …” (concaténer jusqu’au prochain “Frais de livraison”, “Offre Locative”, ou prochain produit SY-…)
    - Récupérer la QTE+Total via les règles de A2 (y compris le cas QTE séparée)
  - Pusher la ligne dans `result.lignes` même si la détection précédente n’a pas “vu” un pattern standard.

2) Recovery “Kit Rails RKS-02”
- Si `result.lignes` ne contient pas une ligne dont `reference` est “RKS-02” (ou qui contient “RKS-02” dans la designation) :
  - Chercher `SY-RKS02` dans `lines`
  - Fenêtre de 20 lignes : collecter designation (en excluant `Garantie:`) + récupérer QTE+Total
  - Construire `reference` = “RKS-02” (ou “RKS02” selon ce que l’extraction renvoie) et `prixUnitaire = total/qty`.

C) Debug exploitable (sans DevTools) pour comprendre le texte réellement extrait
Problème actuel : les `console.log('[Cybertek Parser] ...')` ne vous remontent pas de façon fiable.

Amélioration :
- Dans `src/components/data-editor/PDFImportZone.tsx` (ou dans un composant de debug existant), afficher dans le `<details>` “Voir debug” :
  - Un extrait du `rawText` autour du mot “Installation” (par ex. 600–1200 caractères autour)
  - Un extrait autour de “SY-RKS02”
  - La liste des lignes `result.lignes` (référence + qte + total) après parsing
- Cela permet de valider immédiatement :
  - Est-ce que “Installation” est présent dans le texte extrait ?
  - Est-ce que “SY-RKS02” est présent ?
  - Est-ce que les chiffres “2 974,00 €” apparaissent comme un seul token ou séparés ?

Nettoyage
- Une fois la correction validée, retirer les logs console bruyants ajoutés dans `parseCybertekText` (ou les placer derrière un flag debug).

Plan d’exécution (séquencement)
1) Modifier `src/lib/pdf-import-parser.ts` :
   - (A1) rendre `rowEndRegex` non dépendant de `€\s*$` + sélectionner le dernier match
   - (A1) étendre `findSyRefIndexBackwards` (8 → 15) + ajuster garde-fous si besoin
   - (A2) rendre `specialRefMatch` plus permissif (regex) + extraction “dernier montant de ligne”
   - (A2) gérer le cas QTE et montant sur lignes séparées
2) Ajouter le “recovery pass” final (B) dans `parseCybertekText` pour Installation + SY-RKS02 si toujours absents.
3) Ajouter le debug UI (C) dans `PDFImportZone` pour rendre visibles les preuves de parsing.
4) Re-test avec votre PDF “Devis Kedge NAS…” :
   - Invest doit afficher 5 lignes (ou 6 si “Frais de livraison” est aussi ajoutée)
   - “Kit Rails RKS-02” : QTE 2, VTN 216,00, designation complète
   - “Installation” : QTE 2, VTN 974,00, designation complète (texte long)
5) Une fois OK : retirer/limiter le debug (ou le garder derrière un toggle).

Critères de validation (alignés avec votre screenshot)
- Onglet Données → Invest :
  - Ligne “Synology Kit Rails coulissants RKS-02 …” présente
  - Ligne “Installation” présente avec “Prestation d’installation …” complet
  - Les autres lignes existantes restent inchangées (mémoire, chassis, disques)
  - Les montants correspondent au PDF (216,00 et 974,00)

Risques & garde-fous
- Risque : en rendant les regex moins strictes, on pourrait matcher des nombres non pertinents.
  - Garde-fou : toujours privilégier le **dernier** montant “€” du groupe de lignes d’un item, et limiter la fenêtre de collecte (lookahead).
  - Garde-fou : ignorer les montants manifestement “totaux globaux” (ex: 14 700,00) via fenêtre et heuristique (si on est dans le bloc Installation et qu’on rencontre “Offre Locative”, on stoppe la collecte).
- Risque : “Frais de livraison 0,00” peut être filtré par des conditions `> 0`.
  - Ajuster pour accepter explicitement 0,00 € sur cette ligne.

Livrables
- Parser Cybertek robuste : Installation + RKS-02 extraites systématiquement sur ce devis.
- Debug UI permettant de diagnostiquer tout nouveau devis Cybertek sans passer par la console.
