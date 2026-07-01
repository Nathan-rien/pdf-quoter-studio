
ALTER TABLE public.contracts ALTER COLUMN proposal_id DROP NOT NULL;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS is_quick_contract BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS quarterly_rent_ht NUMERIC;
