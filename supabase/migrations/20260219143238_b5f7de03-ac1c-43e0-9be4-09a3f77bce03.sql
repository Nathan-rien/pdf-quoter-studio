ALTER TABLE public.proposal_exports
  ADD COLUMN IF NOT EXISTS selected_options_names jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_nos_options_names jsonb DEFAULT '[]'::jsonb;