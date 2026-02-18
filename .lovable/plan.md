
## Correction : Qté toujours visible même quand les prix sont masqués

### Comportement cible

| Colonne | `investShowPrices = true` | `investShowPrices = false` |
|---|---|---|
| Désignation | ✅ Visible | ✅ Visible |
| Qté | ✅ Visible | ✅ Visible (correction) |
| P.U. HT | ✅ Visible | ❌ Masqué |
| Total HT | ✅ Visible | ❌ Masqué |
| Total investissement | ✅ Visible | ❌ Masqué |

### 3 fichiers à corriger

**1. `RentalProposalPreview.tsx`** (aperçu visuel)

Ligne 779 — la grille passe de `grid-cols-12` à `grid-cols-8` (au lieu de `grid-cols-1`) quand les prix sont masqués, pour accueillir Désignation + Qté.

- En-tête : `Désignation (col-span-6)` + `Qté (col-span-2)` toujours présents ; `P.U. HT` et `Total HT` conditionnels
- Lignes : idem — la cellule Qté (`ligne.quantite`) sort du bloc conditionnel pour être toujours rendue
- Total investissement : reste conditionnel à `investShowPrices`

**2. `RentalProposalExport.tsx`** (génération PDF)

Ligne 288-302 — même logique : `Qté` sort du bloc `${investShowPrices ? ...}` pour être toujours incluse dans le `<th>` et dans le `<td>` de chaque ligne.

**3. `RentalDataEditor.tsx`** (éditeur de saisie)

Ligne 658 — la colonne `Nb` sort du bloc conditionnel `{matriceData.investShowPrices && ...}` pour toujours s'afficher. Ajustement du `colSpan` de la ligne vide.
