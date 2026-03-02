

## Problème

La duplication visible ("Camera medit I700 garantie 1 an. Camera medit I700 garantie 1 an.") se produit **à l'intérieur d'une même ligne**. Or la fonction `removeRepeatedSubstrings` en mode multi-ligne ne traite que les doublons de **groupes de lignes** — elle ne détecte pas les répétitions de mots au sein d'une seule ligne.

Le texte dupliqué arrive probablement concaténé dans un seul "part" (backward scan + forward scan capturent la même phrase), donc le dedup par parts (lignes 1670-1696) ne l'attrape pas non plus.

## Correction — `src/lib/pdf-import-parser.ts`

### Appliquer le dedup mot-par-mot sur chaque ligne individuellement

Dans `removeRepeatedSubstrings`, après le dedup de groupes de lignes, appliquer aussi le dedup mot-par-mot à chaque ligne individuelle :

```typescript
function removeRepeatedSubstrings(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Helper: word-level dedup on a single line
  function dedupLine(line: string): string {
    const words = line.split(/\s+/);
    if (words.length < 4) return line;
    for (let halfLen = 2; halfLen <= Math.floor(words.length / 2); halfLen++) {
      const first = words.slice(0, halfLen).join(' ');
      const second = words.slice(halfLen, halfLen * 2).join(' ');
      if (normalizeForDedup(first) === normalizeForDedup(second)) {
        return words.slice(0, halfLen).concat(words.slice(halfLen * 2)).join(' ');
      }
    }
    return line;
  }

  if (lines.length < 2) {
    return dedupLine(text);
  }

  // Multi-line: detect repeated line-group prefix
  for (let halfLen = 1; halfLen <= Math.floor(lines.length / 2); halfLen++) {
    const firstHalf = lines.slice(0, halfLen).map(normalizeForDedup).join('|');
    const secondHalf = lines.slice(halfLen, halfLen * 2).map(normalizeForDedup).join('|');
    if (firstHalf === secondHalf) {
      const kept = lines.slice(0, halfLen).concat(lines.slice(halfLen * 2));
      return kept.map(dedupLine).join('\n');
    }
  }

  // No line-group duplication, but still dedup within each line
  return lines.map(dedupLine).join('\n');
}
```

Cela corrige le cas "Camera medit I700 garantie 1 an. Camera medit I700 garantie 1 an." en une seule occurrence, tout en conservant les retours à la ligne entre lignes distinctes.

