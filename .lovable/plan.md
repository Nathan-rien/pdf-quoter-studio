
# Refonte visuelle des pages CG (Contrat Cadre Services)

Objectif : redessiner les pages `documentScope: 'contrat'` (actuellement 4 à 9) du template "Contrat Cadre Services" avec fond sombre, bandeau clair, texte deux colonnes et pied de page corporate — sans modifier une seule ligne du texte juridique ni les pages 1-3 (devis).

## 1. Approche technique

Le rendu de ces pages passe aujourd'hui par la branche "flow" de `src/lib/service-proposal-html-generator.ts` (lignes ~628-654) : quand une page n'a que des éléments texte, on jette leurs positions absolues et on les empile en flux dans un `<div>` A4. C'est cette branche qui applique déjà le fond blanc, le padding et le footer "GROUPE | CYBERTEK".

Plutôt que de bricoler des dizaines de `rectEl` sombres dans le seed (fragile, coordonnées absolues), on introduit un **rendu spécifique aux pages CG** dans le générateur HTML. Le seed reste la source de vérité pour le texte ; le générateur applique la présentation.

## 2. Modifications

### 2.1 `src/lib/service-proposal-html-generator.ts`

Ajouter une branche dédiée avant la branche `flowRows` actuelle :

- Détection : `page.documentScope === 'contrat'` ET `nonTextElements.length === 0` (couvre pages 5-8, et 9 après ajustement) — plus une variante pour la page 4 qui contient un rectangle banner (on ignore ses non-text elements et on la rebuild).
- Rendu :
  - `.page-sheet` avec `background:#1a1a1a` inline (override le blanc par défaut).
  - **Bandeau titre** : `<div>` pleine largeur, fond `#f3f4f6`, texte `#1a1a1a` gras majuscules, hauteur ~14mm, contenu = `page.title` (ou un titre dérivé, ex. "CONDITIONS GÉNÉRALES").
  - **Corps deux colonnes** : `<div style="column-count:2;column-gap:8mm;column-fill:balance;">`. On y injecte les textes des articles du seed dans l'ordre Y, avec :
    - titres d'article (détectés par `c.bold === true` sur une ligne courte type "III - …") → `<h3>` blanc pur, souligné, `break-after: avoid`, `break-inside: avoid`.
    - corps → `<p>` couleur `#e5e7eb`, `line-height:1.5`, `break-inside: avoid` pour éviter les coupures moches en milieu de paragraphe (les paragraphes 1.1/1.2 restent séparés par le `\n\n` existant).
  - **Pied de page** : `position:absolute; bottom:8mm`, texte clair `#9ca3af` centré, contenant les coordonnées Groupe Cybertek (déjà présentes en texte libre page 1 : SAS capital 4 471 800 €, 130 rue Achard 33300 Bordeaux, RCS Bordeaux 408 772 960, TVA, tél/email/site à récupérer du même bloc) + logo (petit `<img>` ou texte "GROUPE | CYBERTEK" si le logo n'est pas dispo dans le contexte HTML).
  - `overflow:hidden` sur le conteneur pour respecter la contrainte demandée.

### 2.2 Repagination automatique

Puisque deux colonnes doublent la capacité, on **agrège** le contenu des pages 5-8 (articles I à XIII) et on laisse le CSS multi-colonnes le répartir. Concrètement :

- Nouvelle fonction interne `collectContratArticles(pages)` qui concatène, dans l'ordre, les éléments texte des pages `documentScope: 'contrat'` en excluant la page couverture (4) et la page signatures (9).
- Mesure côté rendu : on essaie d'abord de tout mettre sur **une seule page CG** (bandeau + 2 colonnes + footer). Si le contenu déborde (détection via une passe DOM offscreen dans un iframe déjà utilisée pour la pagination — sinon fallback heuristique : ~4 500 caractères par page à 2 colonnes en 9pt), on découpe en 2 pages, puis 3 si nécessaire. Cible attendue : **2 pages**.
- Les pages 4 (parties signataires) et 9 (signatures) restent des pages séparées, mais adoptent le même style sombre + bandeau + footer, sans colonnage (contenu structuré).

Résultat probable : couverture + périmètre + matériel (1-3 inchangées) → **page 4 "Parties"** → **pages 5-6 "Conditions générales"** (2 colonnes) → **page 7 "Signatures"**. Les titres de page sont mis à jour en conséquence.

### 2.3 `src/lib/seedContratCadreTemplate.ts`

- **Aucune modification du texte juridique.**
- Suppression des `rectEl` banner et des `textEl` de titre décoratifs sur les pages CG (4-9), puisque le bandeau est désormais rendu par le générateur. Les articles restent tels quels (positions Y conservées uniquement pour l'ordre de tri).
- La page 4 garde ses `textEl` "ENTRE LES SOUSSIGNEES", bloc Cybertek, "D'UNE PART", etc. + sa zone dynamique `service_client_info`.
- La page 9 garde `p6-fait`, `p6-le` et la zone dynamique `service_signature`.
- Republier une nouvelle version du template (incrément `version_number`) via `seedContratCadreTemplate()` — déjà géré par la fonction existante.

## 3. Points de vigilance

- **Anti-régression pages 1-3 et preview PDF devis** : la nouvelle branche est gardée par `documentScope === 'contrat'`, donc invisible en mode `devis`.
- **Print** : `column-count` est bien supporté par Chromium (utilisé pour `window.print()`). On force `-webkit-column-break-inside: avoid` sur les titres d'article pour éviter qu'un titre finisse seul en bas de colonne.
- **Overflow** : `overflow:hidden` sur le sheet + logique de découpe multi-pages garantit qu'aucun mot n'est coupé.
- **Footer** : les coordonnées exactes sont extraites du texte `p1-cybertek` déjà présent dans le seed (source unique de vérité, aucun ajout de donnée).
- **Preview iframe** : `ServiceProposalPreview.tsx` consomme déjà le HTML généré ; aucune modif nécessaire là-bas.

## 4. Livrable

- Générateur mis à jour avec la branche dark/2-cols + footer.
- Seed nettoyé (banners CG retirés) et republié (nouvelle version).
- Vérification visuelle via la preview iframe sur une proposition de test (mode contrat) : bandeau clair, fond `#1a1a1a`, texte clair sur 2 colonnes, footer coordonnées + logo, pagination ramenée à ~2 pages CG, aucun débordement.
