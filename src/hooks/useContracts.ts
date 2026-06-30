import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { differenceInMonths, addMonths, parseISO } from 'date-fns';

export type PaymentFrequency = 'mensuel' | 'trimestriel';

export interface Contract {
  id: string;
  proposal_id: string;
  client_name: string;
  commercial_id: string;
  commercial_name?: string;
  amount_ht?: number;
  template_name?: string;
  implementation_month?: string | null;
  financial_partner?: string | null;
  duration_months?: number | null;
  payment_frequency?: PaymentFrequency;
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

export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async (): Promise<Contract[]> => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
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
    mutationFn: async ({ id, updates }: { id: string; updates: { implementation_month?: string | null; financial_partner?: string | null; duration_months?: number | null; payment_frequency?: PaymentFrequency } }) => {
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
