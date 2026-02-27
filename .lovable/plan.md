

## Diagnostic

Le "Total investissement" EST bien généré dans le HTML (la logique `!isMultiPage ? totalHTML + offreAndProposalsHTML` fonctionne), mais il est **tronqué visuellement** par `overflow: hidden` sur le conteneur `.page` de l'export.

**Cause racine** : Le canvas export est plus court que le canvas aperçu (820px vs 919px), mais la pagination utilise le même seuil `INVEST_LINES_PAGE1 = 22`. Avec des lignes à texte long (ex: "Mémoire PC Corsair..." qui s'enroule sur 6 lignes visuelles), le contenu dépasse la hauteur du canvas export et est coupé.

## Correction

### Fichier : `src/components/rental-proposal/RentalProposalExport.tsx`

Réduire le seuil de lignes pour la première page dans le contexte export, en appliquant un ratio proportionnel à la différence de hauteur entre export et aperçu :

- Introduire une constante locale `EXPORT_LINES_PAGE1` calculée comme `Math.floor(INVEST_LINES_PAGE1 * (PDF_BASE_HEIGHT / CANVAS_SCALE.height))` ≈ `Math.floor(22 * 820/919)` = **19 lignes**
- Idem pour `EXPORT_LINES_CONTINUATION` = `Math.floor(INVEST_LINES_CONTINUATION * ratio)` ≈ **28 lignes**
- Utiliser ces constantes dans `investChunksLocal` à la place de `INVEST_LINES_PAGE1` et `INVEST_LINES_CONTINUATION`

Cela garantit que le contenu (tableau + total + offre) ne dépasse jamais la hauteur du canvas export, et déclenche la pagination multi-pages plus tôt si nécessaire.

### Fichier : `src/lib/canvas-constants.ts`

Aucune modification — les constantes existantes restent la référence pour l'aperçu. Les valeurs export-spécifiques sont calculées localement dans l'export.

