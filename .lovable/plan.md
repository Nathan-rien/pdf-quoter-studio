
# Plan de Correction Définitive : Parité WYSIWYG Aperçu → PDF

## Problème Identifié

Le décalage entre l'Aperçu et le PDF provient d'une **divergence dans les bases de calcul** :

| Composant | Conteneur | Base de calcul | Font scale |
|-----------|-----------|----------------|------------|
| **Aperçu** (RentalProposalPreview) | `aspect-[210/297]` + `maxWidth: 580px` | Positions en % de 650x919, rendu dans 580px effectifs | `fontSize * 0.4` |
| **PDF** (pdf-html-generator) | `.page` 650x919px → scalé 1.22x pour A4 | Positions en % de 650x919, rendu dans 650px avant scaling | `fontSize * 0.4` |

Le problème : quand le navigateur imprime la page 650px scalée à 1.22x, les positions relatives (%) s'adaptent, mais les valeurs absolues (fonts, padding) sont calculées sur 650px de base au lieu de 580px. Cela crée un décalage visuel car les textes sont plus espacés proportionnellement.

## Solution : Uniformiser la Base de Rendu

L'approche consiste à générer le HTML du PDF avec **exactement la même structure que l'Aperçu** (580px de largeur), puis laisser le navigateur scaler uniformément toute la page pour A4.

### Étape 1 : Modifier le conteneur .page dans pdf-html-generator.ts

Passer de `650px x 919px` à `580px x 820px` (ratio A4 préservé : 580 * 297/210 ≈ 820) pour correspondre à l'Aperçu.

```css
.page {
  width: 580px;           /* Identique à CANVAS_DISPLAY_MAX_WIDTH */
  height: 820px;          /* 580 * (297/210) */
  position: relative;
  overflow: hidden;
  background: white;
}
```

### Étape 2 : Ajuster le scale print

Le nouveau scale pour A4 sera : `793.7 / 580 ≈ 1.368`

```css
@media print {
  .page {
    transform: scale(1.368);
    transform-origin: top left;
  }
}
```

### Étape 3 : Recalculer les positions dans getSharedElementStyle

Puisque les éléments sont stockés avec des positions en pixels sur un canvas de référence 650x919, il faut appliquer un facteur de conversion pour obtenir des pourcentages corrects dans le conteneur 580x820.

Le ratio de conversion est : `580/650 ≈ 0.892`

Cependant, comme les positions sont déjà en %, elles restent correctes. Ce qui change est la **base de rendu des valeurs absolues** (fonts, padding).

### Étape 4 : Harmoniser les scales de font/icon

Actuellement, pdf-html-generator utilise :
- `PREVIEW_FONT_SCALE = 0.4`
- `PREVIEW_ICON_SCALE = 0.6`

Ces valeurs sont calibrées pour un rendu à 580px (Aperçu). Si on garde un conteneur PDF de 580px, les fonts/icons seront identiques.

## Changements de Code Prévus

### Fichier : `src/lib/pdf-html-generator.ts`

1. **Constantes de rendu PDF** : Introduire `PDF_BASE_WIDTH = 580` et `PDF_BASE_HEIGHT = 820` (ratio A4) pour aligner sur l'Aperçu.

2. **CSS .page** : Modifier la taille du canvas interne de 650x919 vers 580x820.

3. **Scale print** : Mettre à jour le calcul du scale :
   ```typescript
   const A4_WIDTH_CSS_PX = (210 / 25.4) * 96; // ≈ 793.7
   const PRINT_SCALE = A4_WIDTH_CSS_PX / 580; // ≈ 1.368
   ```

4. **Recalcul des positions** : Dans `renderTextElementToHTML`, `renderShapeElementToHTML`, etc., utiliser les nouvelles dimensions de base pour le calcul des pourcentages, OU passer les dimensions au `getSharedElementStyle`.

### Fichier : `src/lib/template-render-utils.ts`

1. **Export d'une fonction de conversion** : Optionnel - ajouter une fonction `getElementStyleForPDF` qui accepte les dimensions cible (580x820) et convertit les positions stockées (base 650x919) en pourcentages appropriés.

## Alternative Simplifiée (Recommandée)

Au lieu de changer les dimensions du canvas, utiliser le **même rendu que l'Aperçu mais avec un scale uniforme**. L'idée :

1. Générer le HTML avec un conteneur de **exactement 580px de large** (comme l'Aperçu).
2. Les positions restent calculées en % par rapport à `CANVAS_SCALE` (650x919) via `getSharedElementStyle` → elles s'adapteront automatiquement au conteneur de 580px.
3. Les fonts/padding restent en valeurs absolues calibrées pour 580px → rendu identique à l'Aperçu.
4. En impression, appliquer un scale uniforme `793.7 / 580 ≈ 1.368` pour remplir la feuille A4.

Cette approche garantit que le HTML généré est **pixel-perfect avec l'Aperçu** avant le scaling print.

## Validation

Après implémentation :
1. Générer un PDF depuis le bouton "Télécharger le PDF"
2. Comparer visuellement chaque page avec l'Aperçu
3. Vérifier que les textes, formes et images sont positionnés de manière identique
4. Confirmer l'absence de puces automatiques (CSS reset)

## Fichiers Modifiés

- `src/lib/pdf-html-generator.ts` : Nouvelle dimension canvas, scale ajusté, CSS aligné sur Aperçu
- `src/lib/canvas-constants.ts` : Optionnel - export de `CANVAS_DISPLAY_MAX_WIDTH` pour réutilisation dans le PDF

## Risques

- **Régression potentielle** : Si d'autres composants dépendent des dimensions 650x919, ils ne seront pas affectés car seul le PDF utilise les nouvelles valeurs.
- **Qualité d'impression** : Le scale 1.368 est légèrement supérieur à 1.22, mais comme la base est plus petite, le résultat visuel sera identique à l'Aperçu.

