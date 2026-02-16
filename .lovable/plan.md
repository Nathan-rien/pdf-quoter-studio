

## Augmenter legerement les limites de lignes par page

### Probleme
Le tableau "Vos investissements" deborde encore d'une ligne sur la page 6, alors qu'il reste de la place en bas des pages 4 et 5. Les constantes actuelles (`INVEST_LINES_PAGE1 = 22`, `INVEST_LINES_CONTINUATION = 32`) sont encore un peu trop basses.

### Solution

Modifier `src/lib/canvas-constants.ts` :

| Constante | Avant | Apres |
|---|---|---|
| `INVEST_LINES_PAGE1` | 22 | 24 |
| `INVEST_LINES_CONTINUATION` | 32 | 34 |

Ces +2 lignes sur chaque page devraient suffire a absorber le debordement visible sur le screenshot sans risquer de troncature grace a la page footer dediee mise en place precedemment.

### Fichier modifie
- `src/lib/canvas-constants.ts` (2 lignes)

