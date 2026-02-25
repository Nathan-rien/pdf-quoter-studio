import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { COMMERCIAUX, CommercialEntity, Commercial } from '@/data/commerciaux';

export function useCommerciaux() {
  const { data: dbCommerciaux } = useQuery({
    queryKey: ['pre-registered-commercials'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pre_registered_commercials')
        .select('commercial_id, telephone');
      return data || [];
    },
    staleTime: 30_000,
  });

  const merged = useMemo(() => {
    return COMMERCIAUX.map(c => {
      const dbEntry = dbCommerciaux?.find(d => d.commercial_id === c.id);
      return dbEntry ? { ...c, telephone: dbEntry.telephone ?? c.telephone } : c;
    });
  }, [dbCommerciaux]);

  const getCommerciauxByEntity = (entity: CommercialEntity): Commercial[] =>
    merged.filter(c => c.entity === entity);

  const getCommercialById = (id: string): Commercial | null =>
    merged.find(c => c.id === id) ?? null;

  return { getCommerciauxByEntity, getCommercialById, commerciaux: merged };
}
