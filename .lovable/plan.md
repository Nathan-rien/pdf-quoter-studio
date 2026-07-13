## Objectif

Renommer « BNP Credit Bail 1 » en « BNP Crédit Bail 1 » (avec accent) partout où l'option apparaît dans le parcours Location, pour rétablir la cohérence avec la matrice Base Taux.

## Constat

Aujourd'hui toutes les références utilisent déjà la même orthographe sans accent (`BNP Credit Bail 1`) : liste `PARTENAIRES`, entrées `BASE_TAUX_DATA`, tables `frais-dossier`, et la liste des partenaires financiers dans les contrats. La matrice devrait donc trouver les taux — mais l'utilisateur souhaite afficher l'accent. Pour éviter de casser le lookup, il faut renommer la clé dans **tous** les fichiers en même temps.

## Fichiers à modifier

- `src/data/base-taux.ts`
  - Renommer les 3 entrées `partenaire: 'BNP Credit Bail 1'` → `'BNP Crédit Bail 1'`
  - Renommer l'entrée correspondante dans la liste `PARTENAIRES`
- `src/data/frais-dossier.ts`
  - Renommer la clé dans la table des frais (ligne 11)
  - Renommer la clé dans la table `Cession client possible` (ligne 43)
- `src/components/contracts/ContractRow.tsx`
  - Renommer l'entrée dans `FINANCIAL_PARTNERS` (ligne 30)

## Compatibilité rétroactive

Les propositions/contrats déjà enregistrés en base avec l'ancienne valeur `"BNP Credit Bail 1"` ne matcheront plus la nouvelle clé. Deux options :

1. **Option A (recommandée)** : Ajouter un petit normaliseur dans `lookupCoefficient` / `getFraisDossier` qui traite `"BNP Credit Bail 1"` comme un alias de `"BNP Crédit Bail 1"`. Aucun impact sur l'historique.
2. **Option B** : Migration SQL pour mettre à jour les enregistrements existants (`proposals`, `contracts`) — plus invasif.

Je pars sur l'option A sauf indication contraire.

## Hors périmètre

Aucun changement de logique de calcul, aucun changement UI ailleurs.