import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateAllMatriceValues } from '@/lib/rental-calculations';
import type { Contract } from '@/hooks/useContracts';

export interface AggregatedRent {
  monthly: number | null;
  quarterly: number | null;
}

export interface AggregatedRents {
  rents: Map<string, AggregatedRent>;
  monthlySum: number;
  quarterlySum: number;
}

function normalizeMoney(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100) / 100 : null;
}

function computeFromExport(row: any): AggregatedRent | null {
  const cached = normalizeMoney(row.loyer_mensuel_ht);
  if (cached != null) return { monthly: cached, quarterly: Math.round(cached * 3 * 100) / 100 };

  const state = row.proposal_state;
  if (!state) return null;

  if (state.kind === 'service-proposal') {
    const total =
      normalizeMoney(state.totalServicesHt) ??
      normalizeMoney(row.montant_investissement) ??
      normalizeMoney(state.totalInvest);
    if (total == null) return null;
    const monthly = Math.round(total * 100) / 100;
    return { monthly, quarterly: Math.round(total * 3 * 100) / 100 };
  }


  const proposal = state?.proposals?.[0];
  if (!proposal) return null;
  const optionsPrices = Array.isArray(state?.optionsServices)
    ? state.optionsServices.filter((o: any) => o.selected).map((o: any) => o.priceTotal ?? 0)
    : [];
  try {
    const calc = calculateAllMatriceValues(
      proposal.montantInvestissement,
      proposal.duree,
      proposal.refinanceur,
      proposal.margeAppliquee,
      optionsPrices,
      proposal.coefficientOverride,
    );
    const loyer = calc?.loyerMensuel;
    return typeof loyer === 'number' && !Number.isNaN(loyer)
      ? { monthly: loyer, quarterly: Math.round(loyer * 3 * 100) / 100 }
      : null;
  } catch {
    return null;
  }
}

function contractFallback(c: Contract): AggregatedRent | null {
  const m = normalizeMoney(c.monthly_rent_ht);
  const q = normalizeMoney(c.quarterly_rent_ht);
  if (m != null) return { monthly: m, quarterly: q ?? Math.round(m * 3 * 100) / 100 };
  if (q != null) return { monthly: Math.round((q / 3) * 100) / 100, quarterly: q };
  return null;
}

export function useAggregatedContractRents(contracts: Contract[]): {
  data: AggregatedRents;
  isLoading: boolean;
} {
  const proposalIds = Array.from(
    new Set(contracts.map((c) => c.proposal_id).filter((v): v is string => !!v)),
  ).sort();

  const key = proposalIds.join(',');

  const { data: exportsMap = new Map<string, any>(), isLoading } = useQuery({
    queryKey: ['aggregated-contract-rents', key],
    enabled: proposalIds.length > 0,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_exports')
        .select('id, proposal_state, loyer_mensuel_ht, montant_investissement')
        .in('id', proposalIds);
      if (error || !data) return new Map<string, any>();
      const map = new Map<string, any>();
      (data as any[]).forEach((row) => map.set(row.id, row));
      return map;
    },
  });

  const rents = new Map<string, AggregatedRent>();
  let monthlySum = 0;
  let quarterlySum = 0;

  contracts.forEach((c) => {
    let rent: AggregatedRent | null = null;
    if (c.proposal_id && exportsMap.has(c.proposal_id)) {
      rent = computeFromExport(exportsMap.get(c.proposal_id));
    }
    if (!rent) rent = contractFallback(c);
    if (rent) {
      rents.set(c.id, rent);
      if (rent.monthly != null) monthlySum += rent.monthly;
      if (rent.quarterly != null) quarterlySum += rent.quarterly;
    }
  });

  return {
    data: {
      rents,
      monthlySum: Math.round(monthlySum * 100) / 100,
      quarterlySum: Math.round(quarterlySum * 100) / 100,
    },
    isLoading: proposalIds.length > 0 && isLoading,
  };
}
