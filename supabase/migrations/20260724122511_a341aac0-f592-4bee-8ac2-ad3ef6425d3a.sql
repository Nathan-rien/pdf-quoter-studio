ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS external_providers jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.contracts AS c
SET external_providers = sp.external_providers
FROM public.proposal_exports AS pe
JOIN public.service_proposals AS sp ON sp.id = pe.service_proposal_id
WHERE c.proposal_id = pe.id
  AND c.proposal_type = 'service'
  AND jsonb_array_length(coalesce(c.external_providers, '[]'::jsonb)) = 0
  AND jsonb_array_length(coalesce(sp.external_providers, '[]'::jsonb)) > 0;