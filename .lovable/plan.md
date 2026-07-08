## Problème
Dans la vue Contrats (location), la date affichée sur chaque ligne repliée est `validated_at` (date de validation). Les utilisateurs s'attendent à voir la **date de mise en place** du contrat (`implementation_month`).

## Changement
Fichier : `src/components/contracts/ContractRow.tsx`

- Ligne 243 : remplacer l'affichage de `contract.validated_at` par `contract.implementation_month` avec fallback sur `validated_at` si la mise en place n'est pas renseignée.
- Aucune autre modification (tri, panneau déplié, logique de sauvegarde restent inchangés).

## Résultat attendu
La date visible sur chaque ligne de contrat reflétera la date de mise en place lorsqu'elle est définie ; sinon elle conservera le comportement actuel.