import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ServiceLine {
  service_id: string;
  label: string;
  amount_ht: number;
  scope: 'total' | 'parc';
  show_price_mode?: 'mensuel' | 'total';
}

export interface InvestLine {
  id: string;
  designation: string;
  qty: number;
  vun: number;
  vtn: number;
}

export interface SiteAddress {
  id: string;
  label: string;
  address: string;
}

export interface OperationalContact {
  firstName?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface ExternalProvider {
  id: string;
  name: string;
  role: string;
  contact: string;
}

export interface ServiceProposal {
  id: string;
  client_name: string;
  client_company?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  client_siret?: string | null;
  client_capital_social?: string | null;
  commercial_id: string;
  commercial_name?: string | null;
  selected_services: ServiceLine[];
  payment_frequency?: 'mensuel' | 'trimestriel' | null;
  payment_mode?: 'prelevement' | 'virement' | 'allin' | null;
  start_date?: string | null;
  contract_duration?: number | null;
  invest_lines: InvestLine[];
  show_invest_price: boolean;
  show_offer_amount: boolean;
  total_services_ht: number;
  total_invest_ht: number;
  site_addresses?: SiteAddress[];
  operational_contact?: OperationalContact;
  external_providers?: ExternalProvider[];
  status: 'draft' | 'sent' | 'validated' | 'cancelled';
  created_at: string;
  updated_at: string;
}


type DbServiceProposal = Awaited<ReturnType<ReturnType<typeof supabase.from>['select']>>['data'] extends (infer T)[] | null ? NonNullable<T> : never;

export function useServiceProposals() {
  return useQuery({
    queryKey: ['service_proposals'],
    queryFn: async (): Promise<ServiceProposal[]> => {
      const { data, error } = await supabase
        .from('service_proposals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ServiceProposal[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateServiceProposal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Omit<ServiceProposal, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('service_proposals')
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ServiceProposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_proposals'] });
      toast({ title: 'Proposition services créée' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateServiceProposal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<ServiceProposal, 'id' | 'created_at' | 'updated_at'>> }) => {
      const { data, error } = await supabase
        .from('service_proposals')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ServiceProposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_proposals'] });
      toast({ title: 'Proposition mise à jour' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });
}

export function useDeleteServiceProposal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_proposals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_proposals'] });
      toast({ title: 'Proposition supprimée' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });
}
