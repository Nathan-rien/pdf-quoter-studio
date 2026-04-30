## Problème confirmé

Les modifications dans `BaseTauxAdmin` sont bien persistées dans `useBaseTauxStore` (vérifié), mais la matrice ne se met pas à jour car :

1. **`ProposalCard.tsx`** appelle `calculateAllMatriceValues(...)` directement dans le rendu, qui en interne lit `getBaseTauxRuntime()`. Cet accès est un *snapshot* hors React : le composant ne s'abonne pas au store, donc aucune re-render ne se déclenche quand un taux est modifié.
2. **`RentalDataEditor.tsx`** s'abonne bien à `useBaseTauxStore` mais ne propage pas cette dépendance jusqu'à `ProposalCard` (la carte est rendue indépendamment).
3. **`rentalProposalStore.ts`** expose `getProposalCalculations` / `getAllProposalsCalculations` (lignes 424, 442, 651) qui appellent aussi `calculateAllMatriceValues`. Quand ils sont consommés via un sélecteur Zustand, ils ne se re-déclenchent que si l'état du store proposal change — pas quand le store baseTaux change.

Résultat : on doit changer d'onglet, recharger la page, ou modifier un champ de la matrice (durée, montant, refinanceur) pour que le coefficient soit relu.

## Correctif

### 1. Abonner `ProposalCard` au store Base Taux

Dans `src/components/rental-proposal/ProposalCard.tsx`, ajouter un abonnement réactif aux entrées Base Taux pour forcer un recalcul à chaque modification :

```ts
import { useBaseTauxStore } from '@/stores/baseTauxStore';
// ...
const baseTauxEntries = useBaseTauxStore((s) => s.entries);

const calculatedValues = useMemo(
  () => calculateAllMatriceValues(
    montantInvestissement,
    proposal.duree,
    proposal.refinanceur,
    proposal.margeAppliquee,
    optionsPrices,
    proposal.coefficientOverride
  ),
  [
    montantInvestissement, proposal.duree, proposal.refinanceur,
    proposal.margeAppliquee, optionsPrices, proposal.coefficientOverride,
    baseTauxEntries, // ← clé : relance le calcul quand un taux est édité
  ]
);
```

L'abonnement à `entries` suffit à déclencher la re-render. `useMemo` évite des recalculs superflus.

### 2. Faire pareil dans les autres consommateurs des calculs

Identifier et corriger les composants qui consomment `getProposalCalculations` / `getAllProposalsCalculations` ou appellent directement `calculateAllMatriceValues` :

- `RentalProposalPreview.tsx`
- `PreviewEditableCanvas.tsx`
- `RentalProposalExport.tsx`
- `pdf-html-generator.ts` (côté génération PDF — pas réactif, ok, lit au moment de l'export ce qui est correct)

Pour chaque composant React concerné : ajouter `const baseTauxEntries = useBaseTauxStore(s => s.entries);` et l'inclure comme dépendance du `useMemo` / recalcul. Pour les sélecteurs du store proposal qui retournent des calculs, soit :
- déplacer le calcul dans le composant avec abonnement, soit
- exposer un hook `useProposalCalculations(id)` qui combine `useRentalProposalStore` + `useBaseTauxStore` et renvoie le résultat à jour.

Je privilégie un petit hook dédié dans `src/hooks/useProposalCalculations.ts` pour éviter de répéter la logique partout :

```ts
export function useProposalCalculations(proposal, optionsPrices) {
  const baseTauxEntries = useBaseTauxStore((s) => s.entries);
  return useMemo(
    () => calculateAllMatriceValues(
      proposal.montantInvestissement, proposal.duree, proposal.refinanceur,
      proposal.margeAppliquee, optionsPrices, proposal.coefficientOverride
    ),
    [proposal, optionsPrices, baseTauxEntries]
  );
}
```

Et l'utiliser dans `ProposalCard`, `RentalProposalPreview`, `PreviewEditableCanvas`, `RentalProposalExport`.

### 3. Vérifications

- Modifier un taux dans `BaseTauxAdmin` → revenir sur la matrice : le coefficient et tous les calculs dérivés (loyer mensuel, somme loyers, coût contrat, coût locatif annuel, marge) doivent se mettre à jour **sans recharger ni toucher la matrice**.
- Aperçu PDF : doit refléter le nouveau coefficient immédiatement.
- Export PDF : doit utiliser la valeur à jour (déjà ok car lecture au moment de l'export).
- Cas où le coefficient est en override manuel : ne doit pas être impacté (comportement existant conservé).

## Fichiers impactés

- `src/hooks/useProposalCalculations.ts` (nouveau)
- `src/components/rental-proposal/ProposalCard.tsx`
- `src/components/rental-proposal/RentalProposalPreview.tsx`
- `src/components/rental-proposal/PreviewEditableCanvas.tsx`
- `src/components/rental-proposal/RentalProposalExport.tsx`

Aucun changement de schéma BDD, aucun changement de logique de calcul — on rend simplement la chaîne de rendu réactive au store Base Taux.
