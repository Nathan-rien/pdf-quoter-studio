

## Augmenter la capacite du tableau investissements par page

### Probleme
Les constantes actuelles sont trop conservatrices :
- `INVEST_LINES_PAGE1 = 12` : la page 4 affiche seulement 12 lignes alors qu'il y a de la place pour environ 18 lignes avant le logo en bas a droite
- `INVEST_LINES_CONTINUATION = 22` : les pages de continuation n'exploitent pas toute la hauteur disponible, il y a de la place pour environ 28 lignes

Cela provoque une extension prematuree sur des pages supplementaires alors que l'espace existant n'est pas pleinement utilise.

### Solution

Modifier uniquement les constantes dans `src/lib/canvas-constants.ts` :

| Constante | Avant | Apres | Justification |
|---|---|---|---|
| `INVEST_LINES_PAGE1` | 12 | 18 | Exploiter l'espace disponible sur la page 4 avant le logo |
| `INVEST_LINES_CONTINUATION` | 22 | 28 | Utiliser la pleine hauteur A4 sur les pages de continuation |
| `INVEST_LINES_LAST_WITH_FOOTER` | 14 | 20 | Ajuster proportionnellement le seuil de debordement footer |

### Impact
- Moins de pages generees pour le meme nombre de lignes
- Le tableau remplit mieux l'espace disponible sur chaque page
- La logique de chunking et de footer overflow reste identique, seuls les seuils changent

### Fichier modifie
- `src/lib/canvas-constants.ts` (3 lignes)

