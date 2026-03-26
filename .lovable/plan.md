

## Plan : Propager coefficientOverride dans getAllProposalsCalculations

### Problème
Le fix précédent a corrigé `getCalculatedValues()` mais pas `getAllProposalsCalculations()` — qui est la fonction réellement utilisée par l'aperçu et l'export PDF pour rendre les blocs "Votre offre" (Loyer mensuel HT, Coût locatif annuel, etc.).

À la ligne 446 de `rentalProposalStore.ts`, l'appel à `calculateAllMatriceValues` omet le 6e argument `proposal.coefficientOverride`.

### Solution
Ajouter `proposal.coefficientOverride` comme 6e argument dans `getAllProposalsCalculations`.

### Fichier modifié

| Fichier | Changement |
|---------|------------|
| `src/stores/rentalProposalStore.ts` | Ligne 446 : ajouter `, proposal.coefficientOverride` après `optionsPrices` |

### Avant
```typescript
calculations: calculateAllMatriceValues(
  proposal.montantInvestissement,
  proposal.duree,
  proposal.refinanceur,
  proposal.margeAppliquee,
  optionsPrices
),
```

### Après
```typescript
calculations: calculateAllMatriceValues(
  proposal.montantInvestissement,
  proposal.duree,
  proposal.refinanceur,
  proposal.margeAppliquee,
  optionsPrices,
  proposal.coefficientOverride
),
```

