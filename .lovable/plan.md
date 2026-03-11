

## Plan : Harmoniser le style du commentaire avec Avantages/Conditions

Le commentaire utilise actuellement des valeurs hardcodées (`28 * PREVIEW_FONT_SCALE`, `Outfit`), tandis que les textes Avantages/Conditions héritent du style de chaque élément du template (police, taille, couleur). Pour garantir une cohérence visuelle, le commentaire doit adopter le style du texte courant (non-bold) des éléments flow.

### Approche

Extraire la police, taille et couleur du premier élément flow non-bold (texte courant des Avantages/Conditions), et appliquer ces mêmes valeurs au commentaire. Si aucun élément flow n'existe, conserver les valeurs actuelles comme fallback.

### Modifications

**`src/components/rental-proposal/RentalProposalPreview.tsx`** (ligne ~1117-1120) :
- Avant le rendu du commentaire, chercher le premier élément non-bold dans `elementsBelow` pour en extraire `fontSize`, `fontFamily`, `color`
- Appliquer ces valeurs au `<div>` du commentaire au lieu des valeurs hardcodées

**`src/components/rental-proposal/RentalProposalExport.tsx`** (ligne ~515) :
- Même logique : extraire le style du premier flow element non-bold
- Appliquer `font-size`, `font-family` et `color` au HTML du commentaire au lieu de `14px` / `Outfit` hardcodés

**`src/lib/pdf-html-generator.ts`** : Aucune modification nécessaire.

### Résultat
Le commentaire Matrice aura exactement la même police, taille et couleur que le texte courant de la section Avantages/Conditions, quel que soit le template utilisé.

