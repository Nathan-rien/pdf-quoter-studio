import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

function normalizeClientName(clientName: string): string {
  return clientName.trim().replace(/\s+/g, ' ');
}

export async function generateServiceContractNumber(clientName: string, date = new Date()): Promise<string | null> {
  const normalizedClientName = normalizeClientName(clientName);
  if (!normalizedClientName) return null;

  const { count, error } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('proposal_type', 'service')
    .eq('client_name', normalizedClientName);

  if (error) throw error;

  return `${format(date, 'yyyyMMdd')}-${(count ?? 0) + 1}`;
}