## Objectif
Corriger le calcul du loyer périodique dans les propositions Services pour qu'il intègre la durée du contrat, avec le libellé approprié.

## Formule
```
moisParPériode = périodicité === 'trimestriel' ? 3 : 1
montant        = totalServicesHt / (durée / moisParPériode)
label          = périodicité === 'trimestriel' ? '€/trimestre' : '€/mois'
```

Exemples:
- 6000 / mensuel / 12 → 500 €/mois
- 6000 / mensuel / 24 → 250 €/mois
- 6000 / trimestriel / 12 → 1500 €/trimestre (montant), affiché avec libellé /trimestre

## Fichiers à modifier

1. **`src/lib/service-proposal-totals.ts`**
   - `computePeriodicRent(total, durationMonths, frequency)` :
     - si `frequency` absent ou `durationMonths` ≤ 0 → `null`
     - `factor = frequency === 'trimestriel' ? 3 : 1`
     - retourne `round2(total / (durationMonths / factor))`
   - Ajouter helper `periodicRentLabel(frequency)` → `'€/trimestre'` ou `'€/mois'`.

2. **`src/components/service-proposal/ServiceProposalDataStep.tsx`**
   - Le bloc "SOIT xxx €/mois HT" doit utiliser la nouvelle formule et le libellé dynamique (`/mois HT` ou `/trimestre HT`).

3. **`src/components/service-proposal/ServiceProposalPreview.tsx`**
   - Remplacer le calcul actuel (`total * factor`) par la formule ci-dessus, adapter le libellé affiché.

4. **`src/components/service-proposal/ServiceProposalExport.tsx`**
   - Idem preview : formule + libellé.

5. **`src/hooks/useContracts.ts`**
   - Pour les propositions Services (branche `service-proposal`), calculer `monthly_rent_ht` / `quarterly_rent_ht` avec la nouvelle formule :
     - `monthly = total / duration` (toujours)
     - `quarterly = total / (duration / 3)` = `monthly * 3`
   - Nécessite d'avoir la durée du contrat côté export (déjà présente dans `proposal_state.contractDuration`).

6. **`src/lib/contract-rent-aggregation.ts`**
   - Même correction que `useContracts` : utiliser `state.contractDuration` pour diviser le total avant d'appliquer le facteur.
   - Fallback si `contractDuration` manquant → `null` (au lieu de faux calcul).

## Points d'attention
- Précision : `Math.round(x * 100) / 100` partout.
- Si `contractDuration` est nul/0, ne pas afficher de montant périodique (retour `null`, UI masque le bloc).
- Ne pas toucher aux propositions Location (branche `calculateAllMatriceValues` reste inchangée).
