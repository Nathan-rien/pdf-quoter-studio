ALTER TABLE public.contracts
  ADD COLUMN jour_facturation_override integer NULL,
  ADD COLUMN derniere_facturation_le date NULL;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_jour_facturation_override_check
  CHECK (jour_facturation_override IS NULL OR (jour_facturation_override BETWEEN 1 AND 28));
