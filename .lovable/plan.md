

## Correction de la page "Bon pour accord"

### Problème
Le contenu dynamique injecté (liste d'options cochables + zone signature) se superpose aux éléments statiques du template (titre "Signature et cachet", mentions légales). Les cases à cocher sont en doublon avec celles déjà présentes sur la page "Nos Options".

### Solution
Supprimer l'injection dynamique sur la dernière page et la rendre 100% statique (comme elle l'était avant). Les cases à cocher restent uniquement sur la page "Nos Options".

### Modifications

| Fichier | Changement |
|---|---|
| `RentalProposalPreview.tsx` (lignes 1398-1449) | Supprimer `renderBonPourAccordPage` et utiliser `renderGenericStaticPage` pour la dernière page |
| `RentalProposalPreview.tsx` (ligne ~1517) | Remplacer l'appel à `renderBonPourAccordPage` par `renderGenericStaticPage` |
| `RentalProposalExport.tsx` (lignes 675-708) | Supprimer l'injection de contenu dynamique sur la dernière page du template |

### Résultat
- La page "Bon pour accord" affiche uniquement les éléments du template (titre, zones de date, signature et cachet, mentions légales) sans superposition
- Les cases à cocher restent sur la page "Nos Options" (Page 6) où elles sont déjà fonctionnelles

