-- Suivi des jours de facturation (contrats de services).
-- Idempotente : peut être rejouée sans erreur.
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS jour_facturation_override integer NULL,
  ADD COLUMN IF NOT EXISTS derniere_facturation_le date NULL;

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_jour_facturation_override_check;
ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_jour_facturation_override_check
  CHECK (jour_facturation_override IS NULL OR (jour_facturation_override BETWEEN 1 AND 28));
