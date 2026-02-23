

## Augmenter la taille du commentaire dans l'apercu et l'export PDF

### Constat

Le commentaire est actuellement rendu en 10px dans l'export et `10 * PREVIEW_FONT_SCALE` dans l'apercu -- plus petit que les textes "Avantages" et "Conditions de l'offre" qui l'entourent.

### Modification

Passer la taille de police du commentaire de **10px a 12px** (et de `10 * PREVIEW_FONT_SCALE` a `12 * PREVIEW_FONT_SCALE` dans l'apercu), pour etre coherent avec les elements de flux voisins.

| Fichier | Ligne | Changement |
|---|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | ~989 | `10 * PREVIEW_FONT_SCALE` → `12 * PREVIEW_FONT_SCALE` |
| `src/components/rental-proposal/RentalProposalExport.tsx` | ~461 | `font-size: 10px` → `font-size: 12px` |

Aucun autre fichier impacte.
