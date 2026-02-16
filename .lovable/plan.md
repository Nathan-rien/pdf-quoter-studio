

## Corriger la pagination : footer conditionnel + suppression du header vide

### Diagnostic

Deux problemes distincts :

1. **`chunks.push(0)` inconditionnel** force toujours une page footer dediee, meme quand il reste de la place sur la derniere page de donnees (cas actuel : 23 lignes sur 32, il reste 9 emplacements).

2. **Le Preview rend un header de tableau vide** quand le chunk a 0 lignes (contrairement a l'Export qui a deja un `chunkLineCount > 0` guard). C'est ce qui produit la "ligne" visible en haut de la page 6.

### Solution

Trois modifications :

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | (1) Revenir a une condition `if (lastChunk > limit - INVEST_FOOTER_RESERVED_LINES)` au lieu de `chunks.push(0)` inconditionnel. (2) Ajouter un guard `pageLines.length > 0` autour du bloc tableau (header + lignes) pour ne pas rendre un header vide sur une page footer-only |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Revenir a la meme condition conditionnelle au lieu de `chunks.push(0)` inconditionnel |
| `src/lib/canvas-constants.ts` | Conserver `INVEST_FOOTER_RESERVED_LINES = 9` (valeur actuelle) |

### Detail technique

**Chunking conditionnel** (dans les deux fichiers) :

```
const lastChunk = chunks[chunks.length - 1];
const limit = chunks.length === 1 ? INVEST_LINES_PAGE1 : INVEST_LINES_CONTINUATION;
if (lastChunk > limit - INVEST_FOOTER_RESERVED_LINES) {
  chunks.push(0); // page footer dediee
}
```

Avec `INVEST_FOOTER_RESERVED_LINES = 9` :
- Seuil continuation = 32 - 9 = 23
- Cas actuel (23 lignes) : `23 > 23` = false -> footer reste sur la page 5
- Cas avec 24+ lignes : `24 > 23` = true -> page footer dediee

**Guard sur le rendu du tableau** (Preview uniquement, l'Export le fait deja) :

```jsx
{pageLines.length > 0 && (
  <div className="border rounded overflow-hidden">
    {/* header + lignes */}
  </div>
)}
```

Cela garantit que si une page footer-only est creee dans un cas extreme, elle n'affichera pas de header de tableau vide.

### Comportement attendu

- 45 lignes : chunks = [22, 23] -> Page 4 (22 lignes), Page 5 (23 lignes + Total + Votre offre + Avantages + Conditions)
- 55 lignes : chunks = [22, 32, 1] -> tout sur 3 pages, footer sur la page avec 1 ligne  
- 54 lignes : chunks = [22, 32] -> `32 > 23` = true -> chunks = [22, 32, 0] -> page footer dediee
- 20 lignes : chunks = [20] -> tout sur une seule page

