

## Drag-and-drop et lignes de separation dans l'onglet Invest

### 1. Ajouter le drag-and-drop sur les lignes produits

**Approche** : Utiliser l'API native HTML5 Drag and Drop (pas de librairie externe) pour reordonner les lignes dans le tableau Invest.

**Modifications dans le store** (`src/stores/rentalProposalStore.ts`) :
- Ajouter une action `reorderLigne(fromIndex: number, toIndex: number)` qui deplace une ligne d'un index a un autre dans le tableau `lignesData`
- Pas de recalcul du montant total necessaire (les lignes ne changent pas, juste leur ordre)

**Modifications dans le composant** (`src/components/rental-proposal/RentalDataEditor.tsx`) :
- Ajouter les attributs `draggable`, `onDragStart`, `onDragOver`, `onDrop` sur chaque `TableRow` de l'onglet Invest
- Afficher une poignee de deplacement (icone `GripVertical`) sur la gauche de chaque ligne
- Effet visuel pendant le drag : opacite reduite sur la ligne source, indicateur de position d'insertion

### 2. Ajouter des lignes de separation

**Modification du type** (`src/lib/pdf-import-parser.ts`) :
- Ajouter un champ optionnel `isSeparator?: boolean` dans `PDFProductLine`
- Les lignes separatrices n'ont pas de quantite, prix unitaire, ou total -- seules `designation` (qui sert de description) et `isSeparator: true` sont definies

**Modification du store** (`src/stores/rentalProposalStore.ts`) :
- Ajouter une action `addSeparatorLigne()` qui insere une ligne avec `isSeparator: true`, `designation: ''`, `quantite: 0`, `prixUnitaire: null`, `totalHT: 0`
- Les lignes separatrices sont exclues du calcul du montant investissement total

**Modifications dans le composant** (`src/components/rental-proposal/RentalDataEditor.tsx`) :
- Ajouter un bouton "Ajouter une separation" a cote du bouton "+ Ajouter"
- Pour les lignes separatrices : afficher une seule cellule qui prend toute la largeur du tableau, avec :
  - Fond bleu ciel (`bg-blue-50`, coherent avec la carte "Saisie" existante dans `ProposalCard`)
  - Bordure bleue discrete (`border-blue-100`)
  - Un champ texte (AutoResizeTextarea) pour la description, placeholder "Description de la section..."
  - Le bouton de suppression habituel

### 3. Impact sur l'apercu et le PDF

Les lignes separatrices seront filtrees dans le rendu PDF (seules les lignes produits sont comptabilisees). L'ordre des lignes sera celui defini par l'utilisateur via le drag-and-drop.

### Resume technique des fichiers modifies

| Fichier | Modification |
|---|---|
| `src/lib/pdf-import-parser.ts` | Ajout champ `isSeparator` dans `PDFProductLine` |
| `src/stores/rentalProposalStore.ts` | Actions `reorderLigne` et `addSeparatorLigne`, exclusion separateurs du total |
| `src/components/rental-proposal/RentalDataEditor.tsx` | Drag-and-drop sur les lignes, rendu conditionnel des separateurs, bouton "Ajouter une separation" |
