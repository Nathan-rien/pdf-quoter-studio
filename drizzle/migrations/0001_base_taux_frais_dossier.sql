ALTER TABLE public.base_taux
  ADD COLUMN IF NOT EXISTS frais_dossier numeric NULL;

DO $$
DECLARE
  franfinance_id uuid;
  matching_count integer;
  matching_durations integer[];
  updated_count integer;
BEGIN
  SELECT id INTO STRICT franfinance_id
  FROM public.financial_partners
  WHERE name = 'Franfinance 1';

  SELECT count(*), array_agg(duree_mois ORDER BY duree_mois)
  INTO matching_count, matching_durations
  FROM public.base_taux
  WHERE partner_id = franfinance_id
    AND montant_min = 1500
    AND montant_max = 19999;

  IF matching_count <> 4
     OR matching_durations IS DISTINCT FROM ARRAY[24, 36, 48, 60] THEN
    RAISE EXCEPTION
      'Franfinance 1 : attendu 4 lignes (24, 36, 48, 60 mois), trouvé % lignes, durées %',
      matching_count, matching_durations;
  END IF;

  UPDATE public.base_taux
  SET frais_dossier = 60
  WHERE partner_id = franfinance_id
    AND montant_min = 1500
    AND montant_max = 19999;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 4 THEN
    RAISE EXCEPTION 'Attendu 4 lignes mises à jour, trouvé %', updated_count;
  END IF;
END
$$;