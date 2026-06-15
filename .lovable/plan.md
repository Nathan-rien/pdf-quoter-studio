## Objectif
Déplacer la colonne **Quantités** en dernière position (colonne 6) dans le tableau de la page Reprise, tant dans l'aperçu interactif que dans l'export PDF.

## Changements techniques

### Actuel (6 colonnes)
```
Description | Quantités | A | B | C | D
```

### Cible (6 colonnes)
```
Description | A | B | C | D | Quantités
```

## Fichiers modifiés

1. **`src/components/rental-proposal/RentalProposalPreview.tsx`** (`renderRepriseContent`)
   - Réorganiser l'ordre des `<th>` dans `<thead>`
   - Déplacer la cellule `Quantités` à la fin des `<tr>` pour :
     - Lignes produits (section 1)
     - Ligne "Synthèse" grise (sous-en-tête)
     - Lignes Total HT / TVA / Total TTC (section 2)
     - Descriptions libres (section 3)

2. **`src/components/rental-proposal/RentalProposalExport.tsx`** (`repriseHTML`)
   - Mêmes réorganisations dans la chaîne HTML générée pour l'export PDF.

## Non-régression
- Colonnes A/B/C/D restent aux positions 2-5.
- Le calcul des grades et le formatage monétaire sont inchangés.
- Les séparateurs gris (`isSeparator`) conservent leur `colSpan=6`.
