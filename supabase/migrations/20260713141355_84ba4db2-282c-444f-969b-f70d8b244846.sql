ALTER TABLE public.service_proposals
  ADD COLUMN IF NOT EXISTS site_addresses jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS operational_contact jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS external_providers jsonb NOT NULL DEFAULT '[]'::jsonb;