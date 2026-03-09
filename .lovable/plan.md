

## Plan : Décaler "Votre offre" sur une nouvelle page quand le tableau dépasse 50%

Quand le tableau "Vos investissements" occupe plus de 50% de la page, les éléments suivants doivent être reportés sur une page dédiée :
- Le bloc "Votre offre" (propositions financières)
- Les éléments texte statiques en flux (Avantages, Conditions)
- Le commentaire issu de l'onglet Matrice

### Logique actuelle

Le footer (Votre offre + texte statique + commentaire) est reporté sur une page dédiée uniquement quand les lignes de données ne laissent pas assez de place pour le footer. Le seuil est calculé comme `INVEST_LINES_PAGE1 - footerLines`.

### Nouvelle logique

Ajouter une condition supplémentaire : si `totalLines > INVEST_LINES_PAGE1 / 2` (soit ~11 lignes sur 22), forcer un chunk `[totalLines, 0]` pour créer une page footer dédiée, même si techniquement tout tiendrait sur une page.

### Modifications dans 3 fichiers

**`src/lib/canvas-constants.ts`** :
- Remplacer `INVEST_SINGLE_PAGE_FOOTER_THRESHOLD = 6` par `Math.floor(INVEST_LINES_PAGE1 / 2)` soit **11**.

**`src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes ~196-241) :
- Importer `INVEST_SINGLE_PAGE_FOOTER_THRESHOLD`
- Ajouter un cas avant le cas 1 : si `totalLines > INVEST_SINGLE_PAGE_FOOTER_THRESHOLD`, retourner `[totalLines, 0]` (données sur page 1, footer sur page 2)
- Garder le cas 1 existant pour les petits tableaux (<= seuil)

**`src/components/rental-proposal/RentalProposalExport.tsx`** (lignes ~394-430) :
- Même modification de la logique de chunking : ajouter la condition 50% avant le cas existant

### Résultat

- Tableau ≤ 11 lignes : tout sur la même page (comme avant)
- Tableau > 11 lignes (>50%) : "Votre offre", texte statique et commentaire sur une page dédiée suivante
- Tableau > 22 lignes : multi-page comme avant (inchangé)

