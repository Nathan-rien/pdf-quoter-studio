

## Plan : Corriger la pagination en ajustant l'estimation visuelle et la logique de seuil

### Problème

L'estimation actuelle utilise `CHARS_PER_VISUAL_LINE = 45`, ce qui surestime le nombre de lignes visuelles. Par exemple, "Carte mère Asus PRIME H810M-E-CSM – H810/LGA1851/DDR5/mATX" (60 caractères) est compté comme 2 lignes alors qu'il tient sur 1. Résultat : 6 produits = 12 lignes estimées, ce qui dépasse le seuil de 11 (50%) et force "Votre offre" sur une page séparée, alors que tout tiendrait sur une seule page.

### Corrections (3 fichiers)

**`src/lib/canvas-constants.ts`** :
- Augmenter `CHARS_PER_VISUAL_LINE` de 45 à 60 (correspond à la largeur réelle de la colonne Désignation dans le rendu)

**`src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes 196-211) :
- Supprimer le "Cas 0" qui force un split prématuré quand `totalLines > seuil`
- Garder uniquement le check naturel : si `totalLines + footerLines ≤ capacité page` → tout sur une page, sinon → split

```
Avant:
  Cas 0: if totalLines > THRESHOLD → split (trop agressif)
  Cas 1: if totalLines <= singlePageThreshold → single page
  Cas 2: if totalLines <= PAGE1 → split

Après:
  Cas 1: if totalLines <= singlePageThreshold → single page  (totalLines + footer ≤ 22)
  Cas 2: if totalLines <= PAGE1 → split (données ok mais pas de place pour footer)
  Cas 3: multi-page (données > 22 lignes)
```

**`src/components/rental-proposal/RentalProposalExport.tsx`** (lignes 394-407) :
- Même suppression du "Cas 0" prématuré dans la logique export

### Résultat attendu

Avec les données de la capture (6 produits, ~8 lignes visuelles, footer ~9 lignes → total 17 ≤ 22), tout tient sur une page. Le split ne se déclenche que si la somme dépasse réellement la capacité.

