import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { COMMERCIAUX, CommercialEntity, Commercial } from '@/data/commerciaux';
import { setCommercialOverrides } from '@/lib/commercials-runtime';

const ENTITY_ADDRESSES: Record<CommercialEntity, string> = {
  'cybertek-pro': '130, rue Achard - Bât. U, 33300 Bordeaux – France',
  'grosbill-pro': "60 Boulevard de l'hôpital, 75013 Paris",
};

const VALID_ENTITIES: CommercialEntity[] = ['cybertek-pro', 'grosbill-pro'];

export function useCommerciaux() {
  const { data: dbCommerciaux } = useQuery({
    queryKey: ['pre-registered-commercials'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pre_registered_commercials')
        .select('commercial_id, telephone, entity, full_name, email, adresse' as any);
      return (data as any[]) || [];
    },
    staleTime: 30_000,
  });

  const merged = useMemo<Commercial[]>(() => {
    // 1) Surcharge des entrées statiques
    const enrichedStatic = COMMERCIAUX.map(c => {
      const dbEntry = dbCommerciaux?.find((d: any) => d.commercial_id === c.id);
      return dbEntry ? { ...c, telephone: dbEntry.telephone ?? c.telephone } : c;
    });

    // 2) Ajout des entrées DB qui n'existent pas dans la liste statique
    const staticIds = new Set(COMMERCIAUX.map(c => c.id));
    const extras: Commercial[] = (dbCommerciaux || [])
      .filter((d: any) => !staticIds.has(d.commercial_id))
      .filter((d: any) => VALID_ENTITIES.includes(d.entity))
      .map((d: any) => ({
        id: d.commercial_id,
        entity: d.entity as CommercialEntity,
        nom: d.full_name || d.commercial_id,
        telephone: d.telephone ?? null,
        email: d.email || '',
        adresse: d.adresse || ENTITY_ADDRESSES[d.entity as CommercialEntity],
      }));

    return [...enrichedStatic, ...extras];
  }, [dbCommerciaux]);

  // Synchronise les overrides côté store (utilisé par getSelectedCommercial)
  useEffect(() => {
    setCommercialOverrides(merged);
  }, [merged]);

  const getCommerciauxByEntity = (entity: CommercialEntity): Commercial[] =>
    merged.filter(c => c.entity === entity);

  const getCommercialById = (id: string): Commercial | null =>
    merged.find(c => c.id === id) ?? null;

  return { getCommerciauxByEntity, getCommercialById, commerciaux: merged };
}
