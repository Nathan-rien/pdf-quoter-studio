import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { differenceInMonths, addMonths, parseISO } from 'date-fns';
import { calculateAllMatriceValues } from '@/lib/rental-calculations';

export type PaymentFrequency = 'mensuel' | 'trimestriel';
export type ProposalType = 'location' | 'service';

export interface Contract {
  id: string;
  proposal_id: string | null;
  proposal_type: ProposalType;
  client_name: string;
  commercial_id: string;
  commercial_name?: string;
  amount_ht?: number;
  template_name?: string;
  implementation_month?: string | null;
  financial_partner?: string | null;
  duration_months?: number | null;
  payment_frequency?: PaymentFrequency;
  contract_number?: string | null;
  monthly_rent_ht?: number | null;
  quarterly_rent_ht?: number | null;
  cession_percent?: number | null;
  is_quick_contract?: boolean;
  attachment_url?: string | null;
  attachment_name?: string | null;
  validated_at: string;
  created_at: string;
  updated_at: string;
}



export function isContractRenewingSoon(contract: Contract): boolean {
  if (!contract.implementation_month || !contract.duration_months) return false;
  try {
    const start = parseISO(contract.implementation_month);
    const endDate = addMonths(start, contract.duration_months);
    const monthsLeft = differenceInMonths(endDate, new Date());
    return monthsLeft >= 0 && monthsLeft <= 6;
  } catch { return false; }
}

export function getMonthsUntilRenewal(contract: Contract): number | null {
  if (!contract.implementation_month || !contract.duration_months) return null;
  try {
    const start = parseISO(contract.implementation_month);
    const endDate = addMonths(start, contract.duration_months);
    return differenceInMonths(endDate, new Date());
  } catch { return null; }
}

export function useContracts(proposalType: ProposalType = 'location') {
  return useQuery({
    queryKey: ['contracts', proposalType],
    queryFn: async (): Promise<Contract[]> => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('proposal_type', proposalType)
        .order('validated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Contract[];
    },
    staleTime: 1000 * 60 * 2,
  });
}


export function useValidateProposal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Omit<Contract, 'id' | 'validated_at' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('contracts').insert(payload).select().single();
      if (error) throw error;
      return data as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Proposition validée', description: 'Le contrat a été créé avec succès.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<Contract, 'client_name' | 'implementation_month' | 'financial_partner' | 'duration_months' | 'payment_frequency' | 'commercial_id' | 'commercial_name' | 'contract_number' | 'monthly_rent_ht' | 'quarterly_rent_ht' | 'cession_percent' | 'attachment_url' | 'attachment_name'>> }) => {
      const { data, error } = await supabase.from('contracts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Contract;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Contrat mis à jour' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });
}

export function useCreateQuickContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (proposalType: ProposalType = 'location'): Promise<Contract> => {
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          proposal_id: null,
          proposal_type: proposalType,
          client_name: 'Nouveau contrat',
          commercial_id: 'quick',
          commercial_name: '',
          is_quick_contract: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Contrat rapide créé', description: 'Renseignez les champs puis enregistrez.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Contrat supprimé' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });
}

export interface ContractProposalRent {
  monthly: number | null;
  quarterly: number | null;
}

function normalizeMoney(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100) / 100 : null;
}

export function useContractProposalRent(proposalId: string | null | undefined) {
  return useQuery({
    queryKey: ['contract-proposal-rent', proposalId],
    enabled: !!proposalId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<ContractProposalRent | null> => {
      if (!proposalId) return null;
      const { data, error } = await supabase
        .from('proposal_exports')
        .select('proposal_state, loyer_mensuel_ht, montant_investissement')
        .eq('id', proposalId)
        .maybeSingle();
      if (error || !data) return null;

      const cached = normalizeMoney((data as any).loyer_mensuel_ht);
      if (cached != null) return { monthly: cached, quarterly: Math.round(cached * 3 * 100) / 100 };

      const state = (data as any).proposal_state;
      if (!state) return null;

      // Service proposal: keep the exact amount entered in the services proposal,
      // then expose both monthly and quarterly displays for contract rows.
      if (state.kind === 'service-proposal') {
        const total =
          normalizeMoney(state.totalServicesHt) ??
          normalizeMoney((data as any).montant_investissement) ??
          normalizeMoney(state.totalInvest);
        if (total == null) return null;
        const duration = Number(state.contractDuration);
        if (!Number.isFinite(duration) || duration <= 0) return null;
        const monthly = Math.round((total / duration) * 100) / 100;
        const quarterly = Math.round((total / (duration / 3)) * 100) / 100;
        return { monthly, quarterly };
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
          proposal.coefficientOverride
        );
        const loyer = calc?.loyerMensuel;
        return typeof loyer === 'number' && !Number.isNaN(loyer)
          ? { monthly: loyer, quarterly: Math.round(loyer * 3 * 100) / 100 }
          : null;
      } catch {
        return null;
      }
    },
  });
}

export interface ContractProposalOption {
  name: string;
  price: number | null;
  priceTotal?: number | null;
  showPriceMode?: 'mensuel' | 'total';
  showPrice?: boolean;
  erpReference?: string | null;
}

export function useContractProposalOptions(proposalId: string | null | undefined) {
  return useQuery({
    queryKey: ['contract-proposal-options', proposalId],
    enabled: !!proposalId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<ContractProposalOption[]> => {
      if (!proposalId) return [];
      const { data, error } = await supabase
        .from('proposal_exports')
        .select('proposal_state')
        .eq('id', proposalId)
        .maybeSingle();
      if (error || !data) return [];
      const state: any = (data as any).proposal_state;
      if (!state) return [];
      // Service proposal → nosOptions ; Location → optionsServices
      const source = Array.isArray(state.nosOptions)
        ? state.nosOptions
        : Array.isArray(state.optionsServices)
          ? state.optionsServices
          : [];
      const items = source.filter((o: any) => o?.selected);

      // Collect option/service ids to look up erp_reference from the catalog.
      const ids = Array.from(
        new Set(
          items
            .map((o: any) => o?.id ?? o?.option_id ?? o?.service_id)
            .filter((v: any) => typeof v === 'string' && v.length > 0),
        ),
      ) as string[];

      const catalog: Record<string, string | null> = {};
      if (ids.length) {
        const { data: opts } = await supabase
          .from('options_services')
          .select('id, erp_reference')
          .in('id', ids);
        (opts ?? []).forEach((o: any) => {
          catalog[o.id] = o.erp_reference ?? null;
        });
      }

      return items.map((o: any) => {
        const rawErp =
          (typeof o.erp_reference === 'string' && o.erp_reference) ||
          (typeof o.erpReference === 'string' && o.erpReference) ||
          null;
        const id = o?.id ?? o?.option_id ?? o?.service_id;
        const erpReference = rawErp ?? (id ? catalog[id] ?? null : null);
        return {
          name: String(o.name ?? o.title ?? '—'),
          price: typeof o.price === 'number' ? o.price : null,
          priceTotal: typeof o.priceTotal === 'number' ? o.priceTotal : null,
          showPriceMode: o.showPriceMode ?? 'mensuel',
          showPrice: o.showPrice !== false,
          erpReference,
        };
      });
    },
  });
}


