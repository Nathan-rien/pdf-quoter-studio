
Objectif
- Corriger définitivement l’import Cybertek pour la ligne “Installation” afin que :
  - Désignation = texte complet (incluant “Prestation d’installation …”)
  - Nb = 2 (au lieu de 14)
  - VTN (total HT ligne) = 974,00 € (au lieu de 700,00 €)
  - VUN = total / Nb (487,00 € si Nb=2 et total=974,00)
- Améliorer l’affichage de la colonne “Désignation” dans l’onglet Invest pour éviter le texte tronqué / scrollbar interne.

Constat / cause racine (d’après le code actuel et vos captures)
- Le parsing “special refs” (Installation / Frais de livraison / Prestation) cherche un motif “QTE + montant €” uniquement quand il se trouve à la fin du buffer concaténé.
- Or, dans les PDF Cybertek, le montant “2 974,00 €” n’est pas forcément en fin de buffer (la désignation continue sur d’autres lignes après), donc le parser ne “match” pas à ce moment-là.
- Le parser continue alors à concaténer jusqu’à rencontrer plus loin un montant en fin de ligne qui ressemble à “14 700,00 €” (total global). Ce total global est alors mal interprété comme “QTE=14 + montant=700,00”, d’où :
  - Nb=14
  - VTN=700,00
  - et en plus la désignation se retrouve polluée/concaténée et partiellement tronquée.
- En parallèle, l’ajout de “Prestation” dans `specialRefs` peut faire perdre le mot “Prestation” dans la désignation si la ligne détectée commence par “Prestation …” (le code supprime le préfixe correspondant au `specialRefMatch`).

Changements proposés (implémentation)
A) Corriger le parsing de la ligne Installation (src/lib/pdf-import-parser.ts)
1) Revoir la stratégie “special refs”
- Retirer “Prestation” de `specialRefs` (pour éviter de considérer “Prestation …” comme une “référence” et supprimer le mot de la désignation).
  - Garder : `['Installation', 'Frais de livraison']`.
- Ajouter une détection dédiée “Installation en 2 lignes” :
  - Cas fréquent : une ligne contient uniquement “Installation” (REF), suivie d’une ligne qui commence par “Prestation d’installation …” (désignation) et qui porte (ou non) les colonnes QTE/Total.
  - Si on voit une ligne “Prestation …” et qu’une des 1–2 lignes précédentes (non bannies) est exactement “Installation”, alors on considère que c’est la ligne Installation, avec ref = “Installation” et désignation = la ligne “Prestation …” (et ses éventuelles continuations).

2) Ne plus chercher “QTE + montant €” uniquement en fin de buffer global
- Remplacer le `while` actuel (qui concatène et match uniquement en fin de buffer) par une logique “fenêtre” (lookahead) limitée, pour éviter d’absorber le total global :
  - À partir du début de la ligne service (Installation / Frais de livraison), scanner les 1 à 6 lignes suivantes maximum (jusqu’à rencontrer un nouveau bloc produit : `syRefPattern`, `shortRefPattern`, une autre ref spéciale, ou un stop marker).
  - Pour chaque ligne de cette fenêtre :
    - Essayer d’extraire un candidat “QTE + montant €” sur la ligne elle-même (pas sur tout le buffer).
    - Extraire aussi éventuellement un “montant €” seul si QTE n’est pas détectable (fallback: QTE=1).
  - Sélectionner le meilleur candidat selon des heuristiques simples et robustes :
    - Priorité aux candidats trouvés le plus tôt (proches de la ligne Installation)
    - Ignorer explicitement les lignes contenant des marqueurs de total (Total HT/TVA/TTC) si présents
    - Si plusieurs montants détectés : préférer celui qui ressemble à un total de ligne (souvent plus petit que le total global) ; typiquement on peut écarter un montant qui est “manifestement” le total global en fin de doc en limitant la fenêtre + en appliquant une règle “si plusieurs montants > 100€ existent, prendre le plus petit dans la fenêtre”.

3) Construire la désignation “propre”
- Construire la désignation à partir des lignes de description (ex: “Prestation d’installation …”) + ses continuations, mais :
  - Retirer de la désignation les colonnes numériques détectées (QTE / montant) quand elles sont sur la même ligne (couper la ligne avant le motif monétaire repéré).
  - Ne jamais concaténer des lignes qui appartiennent clairement à un autre bloc (nouvelle ref, “Frais de livraison”, ref SY-…, etc.)

4) Sécurité anti-régression (pour éviter de retomber sur “14 700,00”)
- Stopper la collecte dès qu’on rencontre :
  - une autre ref spéciale (ex: “Frais de livraison” après “Installation”)
  - un nouveau produit (SY-…)
  - un stop marker (TOTAL/CONDITIONS/Offre Locative…)
- Limiter strictement la fenêtre (ex: max 6 lignes) pour empêcher l’absorption des totaux de bas de page.

B) Améliorer l’affichage Désignation (src/components/rental-proposal/RentalDataEditor.tsx)
1) Augmenter la taille visible par défaut
- Passer `rows={2}` à `rows={4}` (ou 3 si vous préférez plus compact)
- Augmenter `min-h` (ex: `min-h-[72px]`) pour afficher plusieurs lignes sans action manuelle.

2) Éviter la scrollbar interne (auto-resize)
- Implémenter un “auto-resize textarea” (petit composant local ou logique via ref) :
  - à chaque changement + au montage, ajuster la hauteur du textarea à `scrollHeight` (avec `overflow-hidden`).
  - Cela affiche l’intégralité du texte sans scroll interne, tout en gardant `resize-y` si vous souhaitez laisser l’utilisateur agrandir encore.

3) Largeur
- Conserver `min-w-[300px]`, mais sur desktop on peut viser plus confortable (ex: `min-w-[420px]` ou `w-[520px]`) selon votre mise en page actuelle.
- Optionnel : ajouter `align-top` sur la cellule pour un rendu plus propre quand la hauteur augmente.

Plan d’exécution (séquencement)
1) Modifier `src/lib/pdf-import-parser.ts`
- Retirer “Prestation” de `specialRefs`
- Ajouter la détection “Installation standalone + Prestation…” (lookback 1–2 lignes)
- Réécrire le parsing service lines en mode “fenêtre lookahead” + extraction par ligne (pas buffer global)
- Ajuster la construction de `designation` (couper avant la partie monétaire détectée)
- Ajouter logs de debug temporaires (console.log) pour afficher la ligne Installation extraite (référence, qte, total, extrait de designation) afin de valider rapidement.

2) Modifier `src/components/rental-proposal/RentalDataEditor.tsx`
- `Textarea` : rows plus grand + min-height plus grand
- Ajouter auto-resize (idéalement un mini composant réutilisable dans ce fichier pour garder le code propre)

Tests de validation (ce que je vérifierai dans l’UI)
- Importer le PDF Cybertek Kedge NAS :
  - La ligne “Installation” affiche :
    - Nb = 2
    - VTN = 974,00 €
    - VUN = 487,00 (ou proche selon arrondi)
    - Désignation contient “Prestation d’installation…” en entier (et pas tronqué)
  - Vérifier que “Frais de livraison” n’est pas absorbé dans la désignation Installation
  - Vérifier que les autres lignes produits (matériel) ne sont pas affectées

Cas limites couverts
- Installation dont le montant dépasse 1 000 € (espaces milliers) : la stratégie “fenêtre + candidat le plus proche” évite l’erreur “14 700” et reste robuste.
- Installation sans QTE explicite sur la même ligne : fallback QTE=1 + total détecté, ou QTE détecté sur une autre ligne de la fenêtre.

Livrables
- Correction parsing Cybertek Installation (et stabilité des valeurs Nb/VUN/VTN)
- Affichage Désignation plus lisible (texte visible sans scroll interne, et plus de lignes par défaut)
