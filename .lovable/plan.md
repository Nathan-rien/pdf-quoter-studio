

## Correction de la troncature des désignations longues

### Problème identifié

1. **Aperçu** (`RentalProposalPreview.tsx`, ligne 1032) : la classe `line-clamp-2` tronque le texte de la désignation à 2 lignes maximum. Le texte supplémentaire est coupé.
2. **Export PDF** (`RentalProposalExport.tsx`, ligne 374) : la cellule `<td>` de la désignation n'a pas de `word-wrap: break-word` ni de `max-width`, ce qui peut empêcher le retour à la ligne sur les textes longs.

### Corrections

| Fichier | Ligne | Modification |
|---|---|---|
| `RentalProposalPreview.tsx` | 1032 | Retirer `line-clamp-2` de la cellule désignation pour afficher tout le texte |
| `RentalProposalExport.tsx` | 374 | Ajouter `word-wrap: break-word; max-width: 60%;` sur le `<td>` désignation |

### Impact

Le texte complet de chaque désignation sera visible dans l'aperçu et l'export PDF. Les lignes du tableau s'adapteront en hauteur automatiquement. La pagination existante (nombre de lignes par page) continuera à fonctionner normalement car elle se base sur le nombre de lignes de données, pas sur la hauteur visuelle.

