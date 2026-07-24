import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

function normalizeClientName(clientName: string): string {
  return clientName.trim().replace(/\s+/g, ' ');
}

export async function generateServiceContractNumber(
  clientName: string,
  date = new Date(),
  excludeContractId?: string,
): Promise<string | null> {
  const normalizedClientName = normalizeClientName(clientName);
  if (!normalizedClientName) return null;

  let query = supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('proposal_type', 'service')
    .eq('client_name', normalizedClientName);

  if (excludeContractId) {
    query = query.neq('id', excludeContractId);
  }

  const { count, error } = await query;

  if (error) throw error;

  return `${format(date, 'yyyyMMdd')}-${(count ?? 0) + 1}`;
}