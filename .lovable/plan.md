## Cause identifiée

Dans `src/lib/service-proposal-html-generator.ts`, le renderer utilise **deux branches distinctes** pour les pages statiques :

- **Page 5** (et toutes pages avec au moins un `rect`/bannière) → passe par `renderPageToHTML` qui applique `PREVIEW_FONT_SCALE = 0.4` (défini dans `src/lib/canvas-constants.ts`). Un texte à `fontSize: 9` s'affiche donc à `9 × 0.4 → 6px` (min).
- **Page 6, 7, 8** (aucun `nonTextElement`) → tombent dans la branche "flowRows" (ligne 603-628) qui applique un facteur **`0.73` en dur** : `9 × 0.73 ≈ 6.57px`, arrondi à 6.6px. En pratique le rendu résultant est visuellement plus grand que les pages avec bandeau, d'où l'écart signalé.

C'est cet écart de scale (0.4 vs 0.73) qui explique que la page 6 apparaît avec un corps de texte plus gros que la page 5.

## Correctif

Fichier unique : `src/lib/service-proposal-html-generator.ts`

1. Importer `PREVIEW_FONT_SCALE` depuis `@/lib/canvas-constants`.
2. Dans la branche `flowRows` (ligne 607), remplacer :
   ```
   const fs = Math.max((c.fontSize || 9) * 0.73, 5).toFixed(1);
   ```
   par :
   ```
   const fs = Math.max((c.fontSize || 9) * PREVIEW_FONT_SCALE, 6).toFixed(1);
   ```
   → même formule et même plancher (6px) que `renderTextElementToHTML` utilisé par les pages avec bandeau.
3. Ajuster les marges verticales (`mt`) de la branche flow (`'6px' / '1.5px'`) pour rester proportionnelles à la nouvelle taille (baisser à `'3px' / '1px'`), sinon les blocs seront trop espacés par rapport aux nouvelles tailles de texte.

Aucune modification :
- du seed du template (les `fontSize: 9` restent inchangés),
- des pages avec bandeau (page 5, 9…),
- des zones dynamiques,
- de la branche `boundedTextBoxes` / du rendu PDF exporté (même formule qui reste cohérente avec le calcul actuel des exports).

## Vérification

Après application, ouvrir la proposition « Test Greg », onglet **Aperçu & Export**, mode **Contrat**, et comparer visuellement pages 5 → 8 : la taille de police et la hiérarchie doivent être identiques.
