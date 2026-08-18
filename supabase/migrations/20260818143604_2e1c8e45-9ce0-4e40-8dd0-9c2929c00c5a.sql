ALTER TABLE public.intervention_planning
  ALTER COLUMN reference_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS service_label text;