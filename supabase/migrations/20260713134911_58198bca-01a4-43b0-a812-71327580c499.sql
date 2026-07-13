ALTER TABLE public.options_services
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'option',
  ADD COLUMN IF NOT EXISTS pack_service_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS erp_reference text;

ALTER TABLE public.options_services
  DROP CONSTRAINT IF EXISTS options_services_kind_check;
ALTER TABLE public.options_services
  ADD CONSTRAINT options_services_kind_check CHECK (kind IN ('option','pack'));