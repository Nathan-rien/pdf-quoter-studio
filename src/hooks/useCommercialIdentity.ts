import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCommerciaux } from '@/hooks/useCommerciaux';
import { Commercial } from '@/data/commerciaux';

interface UseCommercialIdentityReturn {
  commercial: Commercial | null;
  commercialId: string | null;
  isLoading: boolean;
}

export function useCommercialIdentity(): UseCommercialIdentityReturn {
  const { user, isCommercial } = useAuth();
  const [commercialId, setCommercialId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getCommercialById } = useCommerciaux();

  useEffect(() => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    supabase
      .from('pre_registered_commercials')
      .select('commercial_id')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data }) => {
        setCommercialId(data?.commercial_id ?? null);
        setIsLoading(false);
      });
  }, [user?.email, isCommercial]);

  const commercial = commercialId ? getCommercialById(commercialId) : null;
  return { commercial, commercialId, isLoading };
}
