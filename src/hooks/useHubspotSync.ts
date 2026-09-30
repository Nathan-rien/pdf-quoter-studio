import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HubspotSyncLogEntry {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'error';
  records_processed: number;
  error_message: string | null;
  triggered_by_user: string | null;
}

export function useHubspotSyncLog() {
  return useQuery({
    queryKey: ['hubspot-sync-log'],
    queryFn: async (): Promise<HubspotSyncLogEntry[]> => {
      const { data, error } = await supabase
        .from('hubspot_sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as HubspotSyncLogEntry[];
    },
    staleTime: 1000 * 30,
  });
}

export function useTriggerHubspotSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('hubspot-sync', { body: {} });
      if (error) throw error;
      return data as { success?: boolean; records_processed?: number; error?: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hubspot-sync-log'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      if (data?.error) {
        toast({ title: 'Synchro terminée avec des erreurs', description: data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Synchro HubSpot terminée', description: `${data?.records_processed ?? 0} enregistrements traités.` });
      }
    },
    onError: (err: Error) => {
      toast({ title: 'Échec de la synchro', description: err.message, variant: 'destructive' });
    },
  });
}
