
## Agrandir les colonnes numériques dans l'onglet Invest

### Diagnostic

Dans `RentalDataEditor.tsx`, les colonnes numériques ont des largeurs fixes trop étroites pour les grands nombres :

| Colonne | Largeur actuelle | Problème |
|---|---|---|
| Nb | `w-24` (96px) | Acceptable |
| VUN | `w-28` (112px) | Trop étroit pour ex. "1 611" ou "10 000" |
| VTN | `w-28` (112px) | Idem |

Les champs `Input` dans ces cellules héritent de la largeur de la colonne mais n'ont pas de largeur explicite — ils remplissent le `TableCell`. Le problème vient donc des `TableHead` qui contraignent la largeur de la colonne.

### Modification — 1 fichier

**`src/components/rental-proposal/RentalDataEditor.tsx`** — lignes 666–711

1. **En-tête Nb** : `w-24` → `w-28` (légère augmentation pour cohérence)
2. **En-tête VUN** : `w-28` → `w-36` (144px, confortable pour "10 000,00 €")
3. **En-tête VTN** : `w-28` → `w-36` (idem)
4. **Inputs dans les cellules** : ajouter `w-full` pour s'assurer que chaque champ remplit bien sa cellule

### Résultat attendu

Les valeurs comme `1 611`, `10 166,50`, `5 189,76` seront entièrement visibles sans troncature dans les colonnes VUN et VTN.
