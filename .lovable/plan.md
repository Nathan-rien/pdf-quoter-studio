

## Optimiser le remplissage des pages du tableau investissements

### Probleme
Les constantes actuelles (`INVEST_LINES_PAGE1 = 18`, `INVEST_LINES_CONTINUATION = 28`) sont encore trop conservatrices :
- **Page 4** : il reste de l'espace visible entre la derniere ligne du tableau et le logo en bas a droite. On peut afficher environ 22 lignes.
- **Page 5** : la page de continuation peut contenir environ 32 lignes avant d'atteindre le bas de page.
- **Page 6** : une page quasi-vide avec seulement 1-2 lignes + le total, ce qui est un gaspillage d'espace.

### Solution

Modifier uniquement les constantes dans `src/lib/canvas-constants.ts` :

| Constante | Avant | Apres | Justification |
|---|---|---|---|
| `INVEST_LINES_PAGE1` | 18 | 22 | Remplir l'espace avant le logo en bas de page 4 |
| `INVEST_LINES_CONTINUATION` | 28 | 32 | Exploiter la pleine hauteur A4 sur les pages de continuation |
| `INVEST_LINES_LAST_WITH_FOOTER` | 20 | 24 | Ajuster proportionnellement le seuil pour le bloc total/propositions |

### Impact concret
Avec le devis actuel (environ 50 lignes visibles sur les screenshots) :
- **Avant** : page 4 (18 lignes) + page 5 (28 lignes) + page 6 (quelques lignes + total) = 3 pages
- **Apres** : page 4 (22 lignes) + page 5 (32 lignes) = les ~50 lignes + total tiennent potentiellement en 2 pages

### Fichier modifie
- `src/lib/canvas-constants.ts` (3 lignes)

