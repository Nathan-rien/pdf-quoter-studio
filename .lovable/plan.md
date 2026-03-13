

## Plan : Estimer la hauteur visuelle des lignes pour une pagination fiable

### Problème

Le système actuel compte chaque `PDFProductLine` comme **1 ligne**, quel que soit la longueur du texte de désignation. Une ligne avec 15 lignes de texte wrappé compte comme 1, ce qui fait que 2 produits avec de longues descriptions (occupant visuellement 60% de la page) passent sous le seuil de 11 et ne déclenchent pas le report du footer.

### Solution

Remplacer `lignesData.length` par une fonction `estimateVisualLines(lignesData)` qui estime le nombre de lignes visuelles occupées. Pour chaque ligne produit, on compte le nombre de lignes de texte wrappé en divisant la longueur de la désignation par un nombre de caractères par ligne visuelle (~45 caractères pour la colonne Désignation à 60% de largeur).

### Modifications

**`src/lib/canvas-constants.ts`** — Ajouter la fonction utilitaire :

```typescript
// Caractères par ligne visuelle dans la colonne Désignation (~60% de largeur)
const CHARS_PER_VISUAL_LINE = 45;

// Estime le nombre de lignes visuelles qu'occupe une liste de produits
export function estimateVisualLines(
  lignes: Array<{ designation?: string | null; isSeparator?: boolean }>
): number {
  return lignes.reduce((total, ligne) => {
    if (ligne.isSeparator) return total + 1;
    const text = ligne.designation || '';
    // Compter les retours à la ligne explicites + wrapping estimé
    const explicitLines = text.split('\n');
    const visualLines = explicitLines.reduce((sum, line) => {
      return sum + Math.max(1, Math.ceil(line.length / CHARS_PER_VISUAL_LINE));
    }, 0);
    return total + Math.max(1, visualLines);
  }, 0);
}
```

**`src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes ~196-197) :
- Importer `estimateVisualLines`
- Remplacer `const totalLines = lignesData.length` par `const totalLines = estimateVisualLines(lignesData)`

**`src/components/rental-proposal/RentalProposalExport.tsx`** (lignes ~394-395) :
- Même remplacement dans le chunking de l'export

### Résultat

- 2 lignes courtes (< 45 car.) = 2 lignes visuelles → tout sur une page
- 2 lignes avec descriptions longues (200+ car.) = ~10-12 lignes visuelles → dépasse 50%, footer reporté
- Logique multi-page existante inchangée car elle continue de fonctionner avec le même compteur

