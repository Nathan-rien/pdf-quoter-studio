

## Augmenter les limites de lignes par page (+2)

### Probleme
Malgre les ajustements precedents, une seule ligne du tableau deborde encore sur la page 6. Les pages 4 et 5 montrent clairement de l'espace inutilise en bas avant le logo/footer.

### Solution

Modifier `src/lib/canvas-constants.ts` :

| Constante | Avant | Apres |
|---|---|---|
| `INVEST_LINES_PAGE1` | 24 | 26 |
| `INVEST_LINES_CONTINUATION` | 34 | 36 |

### Fichier modifie
- `src/lib/canvas-constants.ts` (2 lignes)

