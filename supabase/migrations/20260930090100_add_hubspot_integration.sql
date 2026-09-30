CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hubspot_contact_id text UNIQUE,
  hubspot_company_id text UNIQUE,
  nom text,
  societe text,
  email text,
  telephone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clients_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL,
  date timestamptz NOT NULL,
  resume text,
  montant numeric,
  hubspot_reference text NOT NULL,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, type, hubspot_reference)
);

CREATE INDEX idx_clients_historique_client_id ON public.clients_historique(client_id);

ALTER TABLE public.contracts ADD COLUMN client_id uuid REFERENCES public.clients(id);
CREATE INDEX idx_contracts_client_id ON public.contracts(client_id);

CREATE TABLE public.hubspot_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  records_processed integer NOT NULL DEFAULT 0,
  error_message text,
  triggered_by_user uuid REFERENCES auth.users(id)
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients_historique ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_sync_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
GRANT SELECT ON public.clients_historique TO authenticated;
GRANT ALL ON public.clients_historique TO service_role;
GRANT SELECT ON public.hubspot_sync_log TO authenticated;
GRANT ALL ON public.hubspot_sync_log TO service_role;

-- Lecture seule pour les utilisateurs connectes : les ecritures ne passent que par
-- l'Edge Function hubspot-sync (cle service_role, contourne RLS). Aucune synchro
-- bidirectionnelle dans cette iteration.
CREATE POLICY clients_select_authenticated ON public.clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY clients_historique_select_authenticated ON public.clients_historique
  FOR SELECT TO authenticated USING (true);

CREATE POLICY hubspot_sync_log_select_admin ON public.hubspot_sync_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
