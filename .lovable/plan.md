
## Correction : Toggle "Afficher les prix" dans l'aperçu visuel

### Diagnostic

Il existe deux systèmes de rendu distincts dans l'application :

1. **RentalProposalExport.tsx** → génère le HTML du PDF téléchargeable. ✅ Déjà corrigé lors de la précédente implémentation.
2. **RentalProposalPreview.tsx** → rend l'aperçu visuel dans l'interface. ❌ Non modifié — affiche toujours toutes les colonnes.

La fonction `renderProductTableWithFlowElements()` (ligne ~761) dans le fichier Preview construit le tableau de la page 4 avec des colonnes en dur (`Désignation`, `Qté`, `P.U. HT`, `Total HT`), sans lire `matriceData.investShowPrices`.

### Modification unique

**Fichier : `src/components/rental-proposal/RentalProposalPreview.tsx`**

Dans la fonction `renderProductTableWithFlowElements()` (autour de la ligne 761) :

1. **En-tête du tableau** : conditionner les colonnes Qté, P.U. HT, Total HT avec `matriceData.investShowPrices`
2. **Lignes de données** : conditionner les cellules Qté, P.U. HT, Total HT de chaque ligne
3. **Mise en page de la grille** : ajuster `grid-cols-12` → `grid-cols-1` quand les prix sont masqués (pour que la désignation prenne toute la largeur)
4. **Bloc Total investissement** : conditionner l'affichage du total avec `investShowPrices` (lignes ~800-810)

### Détail technique

Actuellement (lignes 777-795) :
```
grid-cols-12 : Désignation (col-span-6) | Qté (col-span-2) | P.U. HT (col-span-2) | Total HT (col-span-2)
```

Après modification :
- Si `investShowPrices = true` → comportement identique à aujourd'hui
- Si `investShowPrices = false` → grille `grid-cols-1`, seule la désignation affichée, pas de total
