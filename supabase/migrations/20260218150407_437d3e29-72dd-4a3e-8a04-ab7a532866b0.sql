
-- Create options_services table
CREATE TABLE public.options_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  price jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.options_services ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view options"
  ON public.options_services FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert options"
  ON public.options_services FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update options"
  ON public.options_services FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete options"
  ON public.options_services FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_options_services_updated_at
  BEFORE UPDATE ON public.options_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default options with fixed UUIDs
INSERT INTO public.options_services (id, title, subtitle, services, price, is_active, sort_order) VALUES
(
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Pro-Tection',
  NULL,
  '[{"text":"Assurance casse et vol du matériel"},{"text":"Remplacement sous 48h en cas de sinistre"}]'::jsonb,
  NULL,
  true,
  1
),
(
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Pro-Actif',
  'reprise de parc',
  '[{"text":"Audit et valorisation du parc existant"},{"text":"Enlèvement et reprise de parc"}]'::jsonb,
  NULL,
  true,
  2
),
(
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Pro-Flex',
  NULL,
  '[{"text":"Flexibilité des échéances de paiement"},{"text":"Ajustement du contrat en cours de période"}]'::jsonb,
  NULL,
  true,
  3
),
(
  'a1b2c3d4-0004-4000-8000-000000000004',
  'Pro-Spare',
  NULL,
  '[{"text":"Stock de matériel de remplacement"},{"text":"Échange standard en cas de panne"}]'::jsonb,
  NULL,
  true,
  4
),
(
  'a1b2c3d4-0005-4000-8000-000000000005',
  'Pro-Optimisée',
  NULL,
  '[{"text":"Optimisation fiscale de la location"},{"text":"Étude personnalisée de financement"}]'::jsonb,
  NULL,
  true,
  5
),
(
  'a1b2c3d4-0006-4000-8000-000000000006',
  'Pro-maintenance',
  NULL,
  '[{"text":"Maintenance préventive du matériel"},{"text":"Support technique dédié"}]'::jsonb,
  NULL,
  true,
  6
),
(
  'a1b2c3d4-0007-4000-8000-000000000007',
  'Lease back',
  NULL,
  '[{"text":"Rachat de votre parc existant"},{"text":"Conversion en contrat de location"}]'::jsonb,
  NULL,
  true,
  7
),
(
  'a1b2c3d4-0008-4000-8000-000000000008',
  'Pro-duction',
  NULL,
  '[{"text":"Installation et déploiement sur site"},{"text":"Masterisation des équipements"}]'::jsonb,
  NULL,
  true,
  8
),
(
  'a1b2c3d4-0009-4000-8000-000000000009',
  'Pro-support informatique',
  NULL,
  '[{"text":"Technical account manager (TAM) dédié au compte"},{"text":"Prise en main à distance SAV (Diagnostic et intervention)","subItems":["Niveau 1 : premier diagnostic du besoin pour résolution rapide","Niveau 2 : interventions poussées sur un incident gênant voir bloquant"]},{"text":"Ouverture des tickets SAV"}]'::jsonb,
  '{"amount":9.00,"unit":"€ HT / mois / Machine"}'::jsonb,
  true,
  9
),
(
  'a1b2c3d4-0010-4000-8000-000000000010',
  'Pro-license',
  NULL,
  '[{"text":"Gestion des licences logicielles"},{"text":"Suivi des renouvellements"}]'::jsonb,
  NULL,
  true,
  10
)
ON CONFLICT (id) DO NOTHING;
