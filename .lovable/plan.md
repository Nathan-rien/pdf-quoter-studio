## Objectif

Sur les pages CG du contrat services, laisser le texte remplir la colonne de gauche jusqu'au bandeau du bas, puis basculer naturellement dans la colonne de droite — au lieu de la répartition équilibrée actuelle qui crée un gros trou en bas de la colonne de gauche (visible sur la capture, sous l'article IV).

## Cause confirmée

Dans `src/lib/service-proposal-html-generator.ts` ligne 979, le conteneur des articles CG utilise `column-fill:balance`. Cette valeur force le navigateur à égaliser la hauteur des deux colonnes → la colonne de gauche s'arrête tôt (juste après IV) pour équilibrer avec la droite.

## Modification

1. Ligne 979 : remplacer `column-fill:balance` par `column-fill:auto` pour que la colonne de gauche se remplisse jusqu'en bas avant de déborder sur la droite.

2. Lignes 929-932 : retirer les forçages de saut de page sur les articles IX et X (ajoutés au tour précédent). Garder uniquement XI comme point de bascule vers la page 7, puisque le flux naturel prendra désormais en charge la répartition IV → V → VI… dans les colonnes.

## Fichier concerné

- `src/lib/service-proposal-html-generator.ts`

## Résultat attendu

- Page 6 : IV enchaîne avec V dans la colonne gauche, puis le texte déborde en colonne droite en atteignant le bandeau bas.
- Page 7 : reprend à partir de XI comme demandé précédemment, avec signatures en bas.
- Plus d'espace vide visible en milieu de colonne gauche page 6.
