

## Augmenter les limites de lignes a 28 / 38

### Probleme
Malgre les valeurs 26/36, une ligne du tableau deborde toujours sur la page 6. L'espace disponible en bas des pages 4 et 5 n'est pas pleinement utilise.

### Solution

Modifier `src/lib/canvas-constants.ts` :

| Constante | Avant | Apres |
|---|---|---|
| `INVEST_LINES_PAGE1` | 26 | 28 |
| `INVEST_LINES_CONTINUATION` | 36 | 38 |

### Fichier modifie
- `src/lib/canvas-constants.ts` (2 lignes)

