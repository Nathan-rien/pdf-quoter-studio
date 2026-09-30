-- Partenaires financiers et base taux administrables en base.
-- Migration idempotente : peut être rejouée sans effet de bord.
-- Les lignes de public.contracts ne sont PAS modifiées.

-- 1. Tables ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  frais_dossier numeric,
  condition_fin_contrat text CHECK (condition_fin_contrat IN ('Reprise obligatoire loueur', 'Cession client possible')),
  aliases text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.base_taux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.financial_partners(id) ON DELETE RESTRICT,
  montant_min numeric NOT NULL,
  montant_max numeric NOT NULL,
  duree_mois integer NOT NULL,
  taux numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT base_taux_montant_range CHECK (montant_min < montant_max),
  CONSTRAINT base_taux_taux_positive CHECK (taux > 0),
  CONSTRAINT base_taux_duree_positive CHECK (duree_mois > 0)
);

CREATE INDEX IF NOT EXISTS idx_base_taux_partner_duree ON public.base_taux (partner_id, duree_mois);

-- 2. Triggers updated_at ---------------------------------------------------
DROP TRIGGER IF EXISTS update_financial_partners_updated_at ON public.financial_partners;
CREATE TRIGGER update_financial_partners_updated_at
  BEFORE UPDATE ON public.financial_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_base_taux_updated_at ON public.base_taux;
CREATE TRIGGER update_base_taux_updated_at
  BEFORE UPDATE ON public.base_taux
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. RLS : lecture pour tout utilisateur connecté, écriture réservée aux admins
ALTER TABLE public.financial_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_taux ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read financial_partners" ON public.financial_partners;
CREATE POLICY "Authenticated can read financial_partners" ON public.financial_partners
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert financial_partners" ON public.financial_partners;
CREATE POLICY "Admins can insert financial_partners" ON public.financial_partners
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update financial_partners" ON public.financial_partners;
CREATE POLICY "Admins can update financial_partners" ON public.financial_partners
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete financial_partners" ON public.financial_partners;
CREATE POLICY "Admins can delete financial_partners" ON public.financial_partners
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can read base_taux" ON public.base_taux;
CREATE POLICY "Authenticated can read base_taux" ON public.base_taux
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert base_taux" ON public.base_taux;
CREATE POLICY "Admins can insert base_taux" ON public.base_taux
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update base_taux" ON public.base_taux;
CREATE POLICY "Admins can update base_taux" ON public.base_taux
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete base_taux" ON public.base_taux;
CREATE POLICY "Admins can delete base_taux" ON public.base_taux
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Seed partenaires ------------------------------------------------------
-- is_active est calculé à l'insertion uniquement : un rejeu de la migration ne
-- réactive/désactive jamais un partenaire modifié depuis par un admin.
-- Lixxbail, Realease et tous les Olinn sont désactivés pour les nouvelles propositions.
-- "Lixxbail 2" (présent dans l'ancienne liste de ContractRow, sans taux) est créé inactif.
INSERT INTO public.financial_partners (name, frais_dossier, condition_fin_contrat, aliases, sort_order, is_active)
SELECT v.name, v.frais_dossier, v.condition_fin_contrat, v.aliases, v.sort_order,
       NOT (v.name ILIKE '%lixxbail%' OR v.name ILIKE '%olinn%' OR v.name ILIKE '%realease%')
FROM (VALUES
    ('Lixxbail 1', 60, 'Cession client possible', ARRAY['Lixxbail', 'LIXXBAIL']::text[], 1),
    ('Grenke 1', 0, 'Cession client possible', ARRAY['Grenke']::text[], 2),
    ('Franfinance 1', 118, 'Cession client possible', ARRAY[]::text[], 3),
    ('Olinn 2', 135, 'Reprise obligatoire loueur', ARRAY[]::text[], 4),
    ('BNP VR 2', 0, 'Reprise obligatoire loueur', ARRAY[]::text[], 5),
    ('BNP Crédit Bail 1', 0, 'Cession client possible', ARRAY['BNP Credit Bail 1']::text[], 6),
    ('Olinn 2 PC Leno/HP/Dell', 135, 'Reprise obligatoire loueur', ARRAY[]::text[], 7),
    ('Olinn 2 PC autre marque', 135, 'Reprise obligatoire loueur', ARRAY[]::text[], 8),
    ('Olinn 2 Serveurs', 135, 'Reprise obligatoire loueur', ARRAY[]::text[], 9),
    ('Olinn 1 3D dental', 135, 'Cession client possible', ARRAY['Olinn', 'Olinn 1']::text[], 10),
    ('Realease 2', 0, 'Reprise obligatoire loueur', ARRAY[]::text[], 11),
    ('Lixxbail 2', null, null, ARRAY[]::text[], 12)
) AS v(name, frais_dossier, condition_fin_contrat, aliases, sort_order)
ON CONFLICT (name) DO NOTHING;

-- 5. Seed base taux (136 lignes) : uniquement si la table est vide ----------
INSERT INTO public.base_taux (partner_id, montant_min, montant_max, duree_mois, taux)
SELECT p.id, v.montant_min, v.montant_max, v.duree_mois, v.taux
FROM (VALUES
    ('Lixxbail 1', 1000, 5000, 24, 4.4232),
    ('Lixxbail 1', 5001, 10000, 24, 4.405633),
    ('Lixxbail 1', 10001, 20000, 24, 4.398633),
    ('Lixxbail 1', 20001, 500000, 24, 4.377433),
    ('Lixxbail 1', 1000, 5000, 36, 3.054),
    ('Lixxbail 1', 5001, 10000, 36, 3.035233333),
    ('Lixxbail 1', 10001, 20000, 36, 3.0277),
    ('Lixxbail 1', 20001, 500000, 36, 3.0051),
    ('Lixxbail 1', 1000, 5000, 48, 2.3738),
    ('Lixxbail 1', 5001, 10000, 48, 2.354133333),
    ('Lixxbail 1', 10001, 20000, 48, 2.3463),
    ('Lixxbail 1', 20001, 500000, 48, 2.3227),
    ('Lixxbail 1', 1000, 5000, 60, 1.968533333),
    ('Lixxbail 1', 5001, 10000, 60, 1.9482),
    ('Lixxbail 1', 10001, 20000, 60, 1.940066667),
    ('Lixxbail 1', 20001, 500000, 60, 1.9157),
    ('Grenke 1', 500, 2500, 18, 6.02),
    ('Grenke 1', 2501, 5000, 18, 6.01),
    ('Grenke 1', 5001, 12500, 18, 5.99),
    ('Grenke 1', 12501, 25000, 18, 5.98),
    ('Grenke 1', 25001, 37500, 18, 5.97),
    ('Grenke 1', 37501, 50000, 18, 5.96),
    ('Grenke 1', 50001, 500000, 18, 5.94),
    ('Grenke 1', 500, 2500, 24, 4.6),
    ('Grenke 1', 2501, 5000, 24, 4.59),
    ('Grenke 1', 5001, 12500, 24, 4.57),
    ('Grenke 1', 12501, 25000, 24, 4.56),
    ('Grenke 1', 25001, 37500, 24, 4.55),
    ('Grenke 1', 37501, 50000, 24, 4.54),
    ('Grenke 1', 50001, 500000, 24, 4.52),
    ('Grenke 1', 1, 2500, 36, 3.17),
    ('Grenke 1', 2501, 5000, 36, 3.16),
    ('Grenke 1', 5001, 12500, 36, 3.15),
    ('Grenke 1', 12501, 25000, 36, 3.14),
    ('Grenke 1', 25001, 37500, 36, 3.13),
    ('Grenke 1', 37501, 50000, 36, 3.12),
    ('Grenke 1', 50001, 500000, 36, 3.1),
    ('Grenke 1', 500, 2500, 48, 2.47),
    ('Grenke 1', 2501, 5000, 48, 2.46),
    ('Grenke 1', 5001, 12500, 48, 2.44),
    ('Grenke 1', 12501, 25000, 48, 2.43),
    ('Grenke 1', 25001, 37500, 48, 2.42),
    ('Grenke 1', 37501, 50000, 48, 2.4),
    ('Grenke 1', 50001, 500000, 48, 2.38),
    ('Grenke 1', 500, 2500, 60, 2.05),
    ('Grenke 1', 2501, 5000, 60, 2.04),
    ('Grenke 1', 5001, 12500, 60, 2.01),
    ('Grenke 1', 12501, 25000, 60, 2.0),
    ('Grenke 1', 25001, 37500, 60, 1.99),
    ('Grenke 1', 37501, 50000, 60, 1.98),
    ('Grenke 1', 50001, 500000, 60, 1.96),
    ('Franfinance 1', 1500, 19999, 24, 4.424),
    ('Franfinance 1', 20000, 49999, 24, 4.40666667),
    ('Franfinance 1', 50000, 149999, 24, 4.394333),
    ('Franfinance 1', 1500, 19999, 36, 3.0503333),
    ('Franfinance 1', 20000, 49999, 36, 3.03166667),
    ('Franfinance 1', 50000, 149999, 36, 3.018666667),
    ('Franfinance 1', 1500, 19999, 48, 2.36533333),
    ('Franfinance 1', 20000, 49999, 48, 2.34566667),
    ('Franfinance 1', 50000, 149999, 48, 2.3323333),
    ('Franfinance 1', 1500, 19999, 60, 1.9553333),
    ('Franfinance 1', 20000, 49999, 60, 1.9353333),
    ('Franfinance 1', 50000, 149999, 60, 1.9213333),
    ('Olinn 2', 5001, 10000, 24, 4.661),
    ('Olinn 2', 10001, 25000, 24, 4.648),
    ('Olinn 2', 25001, 50000, 24, 4.64),
    ('Olinn 2', 50001, 100000, 24, 4.167),
    ('Olinn 2', 5001, 10000, 36, 3.216),
    ('Olinn 2', 10001, 25000, 36, 3.203),
    ('Olinn 2', 25001, 50000, 36, 3.194),
    ('Olinn 2', 50001, 100000, 36, 2.984),
    ('Olinn 2', 5001, 10000, 48, 2.498),
    ('Olinn 2', 10001, 25000, 48, 2.48),
    ('Olinn 2', 25001, 50000, 48, 2.472),
    ('Olinn 2', 50001, 100000, 48, 2.39),
    ('Olinn 2', 5001, 10000, 60, 2.72),
    ('Olinn 2', 10001, 25000, 60, 2.054),
    ('Olinn 2', 25001, 50000, 60, 2.045),
    ('Olinn 2', 50001, 100000, 60, 2.0),
    ('BNP VR 2', 1000, 500000, 24, 4.12033),
    ('BNP VR 2', 1000, 500000, 36, 2.87567),
    ('BNP VR 2', 1000, 500000, 48, 2.264333333),
    ('BNP VR 2', 1000, 500000, 60, 1.902333333),
    ('BNP Crédit Bail 1', 1000, 500000, 36, 3.027333),
    ('BNP Crédit Bail 1', 1000, 500000, 48, 2.344667),
    ('BNP Crédit Bail 1', 1000, 500000, 60, 1.934667),
    ('Olinn 2 PC Leno/HP/Dell', 25001, 50000, 24, 3.816),
    ('Olinn 2 PC Leno/HP/Dell', 50001, 100000, 24, 3.811),
    ('Olinn 2 PC Leno/HP/Dell', 25001, 50000, 36, 2.787),
    ('Olinn 2 PC Leno/HP/Dell', 50001, 100000, 36, 2.777),
    ('Olinn 2 PC Leno/HP/Dell', 25001, 50000, 48, 2.32),
    ('Olinn 2 PC Leno/HP/Dell', 50001, 100000, 48, 2.311),
    ('Olinn 2 PC Leno/HP/Dell', 25001, 50000, 60, 1.955),
    ('Olinn 2 PC Leno/HP/Dell', 50001, 100000, 60, 1.946),
    ('Olinn 2 PC autre marque', 25001, 50000, 24, 3.972),
    ('Olinn 2 PC autre marque', 50001, 100000, 24, 3.967),
    ('Olinn 2 PC autre marque', 25001, 50000, 36, 2.862),
    ('Olinn 2 PC autre marque', 50001, 100000, 36, 2.853),
    ('Olinn 2 PC autre marque', 25001, 50000, 48, 2.346),
    ('Olinn 2 PC autre marque', 50001, 100000, 48, 2.337),
    ('Olinn 2 PC autre marque', 25001, 50000, 60, 1.969),
    ('Olinn 2 PC autre marque', 50001, 100000, 60, 1.96),
    ('Olinn 2 Serveurs', 25001, 50000, 24, 4.128),
    ('Olinn 2 Serveurs', 50001, 100000, 24, 4.123),
    ('Olinn 2 Serveurs', 25001, 50000, 36, 2.963),
    ('Olinn 2 Serveurs', 50001, 100000, 36, 2.954),
    ('Olinn 2 Serveurs', 25001, 50000, 48, 2.375),
    ('Olinn 2 Serveurs', 50001, 100000, 48, 2.366),
    ('Olinn 2 Serveurs', 25001, 50000, 60, 1.997),
    ('Olinn 2 Serveurs', 50001, 100000, 60, 1.988),
    ('Olinn 1 3D dental', 10000, 25000, 24, 4.61),
    ('Olinn 1 3D dental', 25001, 75000, 24, 4.57257),
    ('Olinn 1 3D dental', 10000, 25000, 36, 3.17167),
    ('Olinn 1 3D dental', 25001, 75000, 36, 3.14167),
    ('Olinn 1 3D dental', 10000, 25000, 48, 2.44967),
    ('Olinn 1 3D dental', 25001, 75000, 48, 2.429),
    ('Olinn 1 3D dental', 10000, 25000, 60, 2.02),
    ('Olinn 1 3D dental', 25001, 75000, 60, 1.9993),
    ('Realease 2', 2500, 4999, 36, 3.401),
    ('Realease 2', 5000, 9999, 36, 3.398),
    ('Realease 2', 10000, 29999, 36, 3.279),
    ('Realease 2', 30000, 49999, 36, 3.248),
    ('Realease 2', 50000, 74999, 36, 3.203),
    ('Realease 2', 75000, 100000, 36, 3.173),
    ('Realease 2', 2500, 4999, 48, 2.675),
    ('Realease 2', 5000, 9999, 48, 2.662),
    ('Realease 2', 10000, 29999, 48, 2.556),
    ('Realease 2', 30000, 49999, 48, 2.532),
    ('Realease 2', 50000, 74999, 48, 2.473),
    ('Realease 2', 75000, 100000, 48, 2.45),
    ('Realease 2', 2500, 4999, 60, 2.231),
    ('Realease 2', 5000, 9999, 60, 2.229),
    ('Realease 2', 10000, 29999, 60, 2.149),
    ('Realease 2', 30000, 49999, 60, 2.115),
    ('Realease 2', 50000, 74999, 60, 2.071),
    ('Realease 2', 75000, 100000, 60, 1.047)
) AS v(partner_name, montant_min, montant_max, duree_mois, taux)
JOIN public.financial_partners p ON p.name = v.partner_name
WHERE NOT EXISTS (SELECT 1 FROM public.base_taux);

-- 6. Requêtes de contrôle (à exécuter à la main) ----------------------------
-- Partenaires actifs/inactifs + nombre de contrats rattachés (nom ou alias,
-- insensible à la casse et aux espaces de début/fin) :
--
-- SELECT p.name, p.is_active,
--        (SELECT count(*) FROM public.base_taux b WHERE b.partner_id = p.id) AS nb_lignes_taux,
--        (SELECT count(*) FROM public.contracts c
--          WHERE lower(btrim(c.financial_partner)) = lower(btrim(p.name))
--             OR lower(btrim(c.financial_partner)) IN (SELECT lower(btrim(a)) FROM unnest(p.aliases) a)
--        ) AS nb_contrats
-- FROM public.financial_partners p
-- ORDER BY p.is_active DESC, p.sort_order;
--
-- Valeurs de contracts.financial_partner non résolues (ni nom ni alias) :
--
-- SELECT c.financial_partner, count(*) FROM public.contracts c
-- WHERE c.financial_partner IS NOT NULL AND btrim(c.financial_partner) <> ''
--   AND NOT EXISTS (
--     SELECT 1 FROM public.financial_partners p
--     WHERE lower(btrim(c.financial_partner)) = lower(btrim(p.name))
--        OR lower(btrim(c.financial_partner)) IN (SELECT lower(btrim(a)) FROM unnest(p.aliases) a))
-- GROUP BY 1 ORDER BY 2 DESC;
