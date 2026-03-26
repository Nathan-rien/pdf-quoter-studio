

## Plan : Corriger la propagation du coefficient override vers l'aperçu et l'export PDF

### Problème
Quand l'utilisateur modifie le coefficient dans l'onglet "Données" (via `ProposalCard`), la valeur `coefficientOverride` est bien stockée dans `proposal.coefficientOverride`. Cependant, la fonction `getCalculatedValues()` dans `rentalProposalStore.ts` (ligne 649-655) ne passe **pas** ce `coefficientOverride` à `calculateAllMatriceValues()`. Le 6e argument est omis.

Résultat : l'aperçu PDF et l'export utilisent toujours le coefficient auto-calculé, ignorant la saisie manuelle.

### Solution
Ajouter `firstProposal?.coefficientOverride` comme 6e argument dans l'appel à `calculateAllMatriceValues` dans `getCalculatedValues()`.

### Fichier modifié

| Fichier | Changement |
|---------|------------|
| `src/stores/rentalProposalStore.ts` | Ligne 654 : ajouter `, firstProposal?.coefficientOverride` après `optionsPrices` dans l'appel `calculateAllMatriceValues(...)` |

### Avant
```typescript
return calculateAllMatriceValues(
  firstProposal?.montantInvestissement ?? state.matriceData.montantInvestissement,
  firstProposal?.duree ?? state.matriceData.duree,
  firstProposal?.refinanceur ?? state.matriceData.refinanceur,
  firstProposal?.margeAppliquee ?? state.matriceData.margeAppliquee,
  optionsPrices
);
```

### Après
```typescript
return calculateAllMatriceValues(
  firstProposal?.montantInvestissement ?? state.matriceData.montantInvestissement,
  firstProposal?.duree ?? state.matriceData.duree,
  firstProposal?.refinanceur ?? state.matriceData.refinanceur,
  firstProposal?.margeAppliquee ?? state.matriceData.margeAppliquee,
  optionsPrices,
  firstProposal?.coefficientOverride
);
```

