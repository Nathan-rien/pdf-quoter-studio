# Ligne "Blancco" fixe en bas du tableau Lignes produits (Reprise)

## Objectif
Garantir qu'une ligne portant la désignation par défaut **"Collect / Audit / Effacement données Blancco"** soit toujours présente en **dernière position** du tableau "Lignes produits (Reprise)", tout en restant **modifiable** (désignation, Nb, VUN).

## Comportement attendu

1. **Présence garantie** : si aucune ligne Blancco n'existe dans `repriseData.lignes`, elle est ajoutée automatiquement au chargement (et lors de toute initialisation/restauration depuis localStorage / historique).
2. **Position fixe en bas** :
   - Le bouton "Ajouter" insère la nouvelle ligne **avant** la ligne Blancco (et non après).
   - L'insertion de séparateurs ne peut pas se faire après la ligne Blancco.
   - Le drag & drop ne peut pas déplacer la ligne Blancco, et aucune autre ligne ne peut être déposée après elle (clamp de `toIndex` à `lignes.length - 2`).
3. **Modifiable** : désignation, Nb et VUN restent éditables comme une ligne normale. Le VTN est recalculé (Nb × VUN).
4. **Non supprimable** : l'icône corbeille est masquée/désactivée sur la ligne Blancco (sinon "fixe" perd son sens). La poignée de drag est également masquée sur cette ligne.
5. **Export PDF & Preview** : aucune logique spéciale — la ligne est rendue comme toutes les autres puisqu'elle fait partie de `repriseData.lignes`.

## Détails techniques

### `src/stores/rentalProposalStore.ts`
- Ajouter une constante `BLANCCO_DEFAULT_DESIGNATION = "Collect / Audit / Effacement données Blancco"` et un flag `isBlancco: true` sur le type `RepriseLigne` (optionnel) pour identifier la ligne de façon stable même après modification du texte.
- Helper `ensureBlanccoLast(lignes)` qui :
  - retire toutes les lignes ayant `isBlancco === true`, en conserve une (ou en crée une avec valeurs par défaut `{ designation: BLANCCO_DEFAULT_DESIGNATION, nb: 1, vun: 1500, vtn: 1500, isBlancco: true }` si aucune),
  - la repousse en dernière position.
- Appliquer ce helper :
  - à l'état initial (`lignes: []` → `ensureBlanccoLast([])`),
  - dans `addRepriseLigne` : insérer la nouvelle ligne **avant** la dernière (Blancco), puis `ensureBlanccoLast`,
  - dans `addRepriseSeparator(atIndex)` : clamper `atIndex` à `lignes.length - 1` max,
  - dans `reorderRepriseLigne(from, to)` : refuser si `from` pointe sur Blancco ; clamper `to` à `lignes.length - 2` ; finir par `ensureBlanccoLast`,
  - dans `deleteRepriseLigne(index)` : ignorer si la ligne ciblée est Blancco,
  - dans `updateRepriseLigne` : autoriser toutes les modifications (le flag `isBlancco` est préservé même si la désignation est éditée),
  - dans la restauration depuis snapshot/localStorage (lignes 982, 1110) : ré-appliquer `ensureBlanccoLast` après hydratation.

### `src/components/rental-proposal/RepriseTab.tsx`
- Pour la ligne où `ligne.isBlancco` est vrai :
  - masquer le bouton corbeille (`Trash2`),
  - masquer la poignée drag (`GripVertical`) et retirer `draggable`,
  - ne pas afficher le bouton "+" d'insertion de séparateur **après** cette ligne (donc ne pas appeler `insertButton(index + 1)` quand la ligne courante est Blancco).

### Hors-scope (aucun changement)
- `RentalProposalPreview.tsx`, `RentalProposalExport.tsx`, calculs des grades : la ligne Blancco est traitée comme n'importe quelle ligne `lignes[]`, donc aucune adaptation nécessaire.
- Aucune migration SQL : tout est côté front + localStorage.

## Question ouverte
La ligne Blancco doit-elle être **non supprimable** (recommandé pour respecter "fixe") ? Si tu préfères qu'elle reste supprimable mais simplement re-créée automatiquement, je peux adapter — dis-le-moi avant l'implémentation.
