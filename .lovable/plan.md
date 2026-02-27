

## Restaurer l'affichage dynamique des options sur la Page 6

### Problème
La Page 6 ("Nos Options") est rendue en mode **statique** (`renderGenericStaticPage(6)` à la ligne 1490), ce qui affiche uniquement les éléments texte du template (cercles, pas de prix). Le rendu dynamique `renderNosOptionsPage()` — qui contient les cases à cocher, les prix et les descriptions — n'est plus appelé.

### Corrections (1 fichier)

**`src/components/rental-proposal/RentalProposalPreview.tsx`**

| Ligne | Changement |
|---|---|
| 1490-1492 | Remplacer `renderGenericStaticPage(6)` par `renderNosOptionsPage()` |
| 1276-1283 | Afficher **tous** les `nosOptions` (pas seulement `selectedNosOptions`) avec une case à cocher reflétant l'état `selected` |
| 1290 | Ajouter le suffixe `/machine` ou `/parc` selon `pricingScope` (comme sur Page 5, ligne 1204) |
| 1295 | Idem pour le mode prix total |

### Détail technique
- Ligne 1490 : `renderGenericStaticPage(6)` → `renderNosOptionsPage()`
- Ligne 1283 : `selectedNosOptions.map(...)` → `nosOptions.map(...)` avec une case visuellement cochée/décochée selon `option.selected`
- Lignes 1290/1295 : ajouter `{(option.pricingScope ?? 'par_machine') === 'pour_le_parc' ? '/parc' : '/machine'}` après le prix

