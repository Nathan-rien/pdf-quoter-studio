import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  hubspot_contact_id: string | null;
  hubspot_company_id: string | null;
  nom: string | null;
  societe: string | null;
  email: string | null;
  telephone: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientHistoriqueEntry {
  id: string;
  client_id: string;
  type: string;
  date: string;
  resume: string | null;
  montant: number | null;
  hubspot_reference: string;
  raw_payload: unknown;
  created_at: string;
}

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase.from('clients').select('*').order('nom', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Client[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useClient(id: string | null | undefined) {
  return useQuery({
    queryKey: ['client', id],
    enabled: !!id,
    queryFn: async (): Promise<Client | null> => {
      if (!id) return null;
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return (data as Client) ?? null;
    },
  });
}

export function useClientHistorique(clientId: string | null | undefined) {
  return useQuery({
    queryKey: ['client-historique', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<ClientHistoriqueEntry[]> => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('clients_historique')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClientHistoriqueEntry[];
    },
  });
}

export function useContractsByClient(clientId: string | null | undefined) {
  return useQuery({
    queryKey: ['contracts-by-client', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('contracts')
        .select('id, client_name, contract_number, proposal_type, monthly_rent_ht, closed_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLinkContractToClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ contractId, clientId }: { contractId: string; clientId: string | null }) => {
      const { error } = await supabase.from('contracts').update({ client_id: clientId }).eq('id', contractId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Client lié au contrat' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });
}
