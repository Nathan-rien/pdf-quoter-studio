

## Plan : Corriger le bug de page blanche — les chunks visuels sont utilisés comme indices de tableau

### Problème racine

`investChunks` contient des **lignes visuelles estimées** (ex: `[22, 18, 0]` pour 40 lignes visuelles), mais `lignesData.slice(offset, offset + chunkLineCount)` les utilise comme **indices de tableau**. Avec 3 produits à longues descriptions estimés à 40 lignes visuelles, `slice(0, 22)` prend les 3 produits (il n'y en a que 3), puis `slice(22, 40)` retourne un tableau vide → page blanche. Le "Total investissement" se perd, et "Votre offre" se retrouve seul sur une page vide.

### Solution

Remplacer la logique de chunking par une fonction qui assigne les **lignes réelles** à chaque page en accumulant la hauteur visuelle estimée de chaque ligne. Chaque chunk stocke le **nombre de lignes réelles** (pas visuelles).

### Modifications (3 fichiers)

**`src/lib/canvas-constants.ts`** — Nouvelle fonction `chunkLinesByVisualHeight` :

```typescript
export function chunkLinesByVisualHeight(
  lignes: Array<{ designation?: string | null; isSeparator?: boolean }>,
  page1Capacity: number,
  continuationCapacity: number,
  footerLines: number
): number[] {
  if (lignes.length === 0) return [0];
  
  // Estimer la hauteur visuelle de chaque ligne
  const heights = lignes.map(ligne => {
    if (ligne.isSeparator) return 1;
    const text = ligne.designation || '';
    const explicit = text.split('\n');
    return Math.max(1, explicit.reduce((s, l) => s + Math.max(1, Math.ceil(l.length / CHARS_PER_VISUAL_LINE)), 0));
  });
  
  const totalVisual = heights.reduce((a, b) => a + b, 0);
  
  // Cas 1 : tout tient sur une page avec le footer
  if (totalVisual + footerLines <= page1Capacity) return [lignes.length];
  
  // Cas 2 : données tiennent sur page 1 mais pas le footer
  if (totalVisual <= page1Capacity) return [lignes.length, 0];
  
  // Cas 3 : multi-page — assigner les lignes réelles par accumulation
  const chunks: number[] = [];
  let currentCapacity = page1Capacity;
  let accumulated = 0;
  let rowCount = 0;
  
  for (let i = 0; i < lignes.length; i++) {
    if (accumulated + heights[i] > currentCapacity && rowCount > 0) {
      chunks.push(rowCount);
      rowCount = 0;
      accumulated = 0;
      currentCapacity = continuationCapacity;
    }
    accumulated += heights[i];
    rowCount++;
  }
  if (rowCount > 0) chunks.push(rowCount);
  
  // Vérifier si le footer tient dans le dernier chunk
  const lastChunkVisual = heights.slice(
    lignes.length - chunks[chunks.length - 1]
  ).reduce((a, b) => a + b, 0);
  
  if (lastChunkVisual + footerLines > continuationCapacity) {
    chunks.push(0); // page footer dédiée
  }
  
  return chunks;
}
```

**`src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes ~196-241) :
- Remplacer tout le bloc `investChunks` par un appel à `chunkLinesByVisualHeight(lignesData, INVEST_LINES_PAGE1, INVEST_LINES_CONTINUATION, footerLines)`

**`src/components/rental-proposal/RentalProposalExport.tsx`** (lignes ~394-431) :
- Même remplacement avec `chunkLinesByVisualHeight(lignesData, EXPORT_LINES_PAGE1, EXPORT_LINES_CONTINUATION, footerLinesLocal)`

### Résultat

Les chunks contiennent des **compteurs de lignes réelles**, donc `lignesData.slice()` fonctionne correctement. 3 produits à longues descriptions → `[3]` (tout sur une page) si la hauteur totale + footer ≤ capacité, ou `[3, 0]` si le footer doit passer sur une autre page.

