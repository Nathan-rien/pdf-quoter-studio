import { useMemo } from 'react';
import { calculateAllMatriceValues, type CalculatedMatriceValues } from '@/lib/rental-calculations';
import { useBaseTauxStore } from '@/stores/baseTauxStore';
import type { MatriceProposal } from '@/stores/rentalProposalStore';

/**
 * Hook réactif qui recalcule la matrice dès qu'une entrée Base Taux change.
 * Utilise un abonnement explicite à useBaseTauxStore pour forcer la re-render
 * (les fonctions de calcul lisent ensuite via getBaseTauxRuntime()).
 */
export function useProposalCalculations(
  proposal: MatriceProposal,
  optionsPrices: (number | null)[]
): CalculatedMatriceValues {
  const baseTauxEntries = useBaseTauxStore((s) => s.entries);

  return useMemo(
    () =>
      calculateAllMatriceValues(
        proposal.montantInvestissement,
        proposal.duree,
        proposal.refinanceur,
        proposal.margeAppliquee,
        optionsPrices,
        proposal.coefficientOverride
      ),
    [
      proposal.montantInvestissement,
      proposal.duree,
      proposal.refinanceur,
      proposal.margeAppliquee,
      proposal.coefficientOverride,
      optionsPrices,
      baseTauxEntries,
    ]
  );
}
