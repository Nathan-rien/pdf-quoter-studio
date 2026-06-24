
-- TABLE: contracts
CREATE TABLE IF NOT EXISTS public.contracts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id          UUID NOT NULL REFERENCES public.proposal_exports(id) ON DELETE CASCADE,
  client_name          TEXT NOT NULL,
  commercial_id        TEXT NOT NULL,
  commercial_name      TEXT,
  amount_ht            NUMERIC(12, 2),
  template_name        TEXT,
  implementation_month DATE,
  financial_partner    TEXT,
  duration_months      INTEGER,
  validated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;

CREATE INDEX IF NOT EXISTS idx_contracts_commercial_id ON public.contracts(commercial_id);
CREATE INDEX IF NOT EXISTS idx_contracts_proposal_id   ON public.contracts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_validated_at  ON public.contracts(validated_at DESC);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_select_authenticated" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contracts_insert_authenticated" ON public.contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contracts_update_admin"         ON public.contracts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "contracts_delete_admin"         ON public.contracts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.update_contracts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_contracts_updated_at();

-- TABLE: service_proposals
CREATE TABLE IF NOT EXISTS public.service_proposals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name         TEXT NOT NULL,
  client_company      TEXT,
  client_email        TEXT,
  client_phone        TEXT,
  client_address      TEXT,
  client_siret        TEXT,
  commercial_id       TEXT NOT NULL,
  commercial_name     TEXT,
  selected_services   JSONB DEFAULT '[]'::jsonb,
  payment_frequency   TEXT CHECK (payment_frequency IN ('mensuel', 'trimestriel')),
  payment_mode        TEXT CHECK (payment_mode IN ('prelevement', 'virement')),
  start_date          DATE,
  contract_duration   INTEGER CHECK (contract_duration IN (12, 24, 36, 48, 60)),
  invest_lines        JSONB DEFAULT '[]'::jsonb,
  show_invest_price   BOOLEAN DEFAULT true,
  show_offer_amount   BOOLEAN DEFAULT true,
  total_services_ht   NUMERIC(12, 2) DEFAULT 0,
  total_invest_ht     NUMERIC(12, 2) DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'validated', 'cancelled')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_proposals TO authenticated;
GRANT ALL ON public.service_proposals TO service_role;

CREATE INDEX IF NOT EXISTS idx_service_proposals_commercial ON public.service_proposals(commercial_id);
CREATE INDEX IF NOT EXISTS idx_service_proposals_status     ON public.service_proposals(status);
CREATE INDEX IF NOT EXISTS idx_service_proposals_created    ON public.service_proposals(created_at DESC);

ALTER TABLE public.service_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_proposals_select" ON public.service_proposals FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_proposals_insert" ON public.service_proposals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "service_proposals_update" ON public.service_proposals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "service_proposals_delete" ON public.service_proposals FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_service_proposals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER service_proposals_updated_at BEFORE UPDATE ON public.service_proposals FOR EACH ROW EXECUTE FUNCTION public.update_service_proposals_updated_at();
