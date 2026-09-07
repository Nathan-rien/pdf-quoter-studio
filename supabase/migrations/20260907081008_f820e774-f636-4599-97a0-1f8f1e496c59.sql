ALTER TABLE public.service_proposals ADD COLUMN IF NOT EXISTS nos_options jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.service_proposals sp
SET selected_services = pe.proposal_state->'selectedServices',
    nos_options = pe.proposal_state->'nosOptions',
    updated_at = now()
FROM public.proposal_exports pe
WHERE pe.service_proposal_id = sp.id
  AND sp.id = '90612eb4-556b-493e-bf56-3c27143fb161'
  AND jsonb_array_length(coalesce(pe.proposal_state->'selectedServices','[]'::jsonb)) > jsonb_array_length(coalesce(sp.selected_services,'[]'::jsonb));