import { useMemo } from 'react';
import { calculateAllMatriceValues, type CalculatedMatriceValues } from '@/lib/rental-calculations';
import { useReferenceData } from '@/hooks/useFinancialPartners';
import type { MatriceProposal } from '@/stores/rentalProposalStore';

/**
 * Hook réactif qui recalcule la matrice dès que les partenaires / la base taux changent.
 * L'abonnement à useReferenceData force la re-render une fois les données Supabase chargées
 * (les fonctions de calcul lisent ensuite le cache synchrone alimenté par ces requêtes).
 */
export function useProposalCalculations(
  proposal: MatriceProposal,
  optionsPrices: (number | null)[]
): CalculatedMatriceValues {
  const { partners, baseTaux } = useReferenceData();

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
      partners,
      baseTaux,
    ]
  );
}
