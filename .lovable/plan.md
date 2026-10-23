# Module Devis Transactionnel (vente simple + option location)

## Ce que verra l'utilisateur

- **Menu** : nouvelle section « Transactionnel » (même niveau que Location et Services) avec « Prop. Transac » et « Historique Transac ». Visible pour les admins et les commerciaux.
- **Prop. Transac** : un écran d'édition en trois blocs.
  1. **En-tête** : marque (Cybertek Pro / Grosbill Pro), n° de devis saisi (obligatoire ; avertissement non bloquant s'il existe déjà, y compris dans le devis d'un autre commercial), n° client, date (aujourd'hui), validité (+7 jours, modifiable), commercial (liste existante ; téléphone et e-mail repris sur le PDF), adresse de livraison, adresse de facturation avec case « identique à la livraison », commentaire.
  2. **Lignes** : référence, désignation multiligne, éco-participation unitaire, PU HT, quantité, total HT. Colonnes internes en zone grisée : prix d'achat, grossiste, réf. fournisseur, taux de marque, marge (valeur et %). Bouton « + Frais de livraison ». Ajout, suppression, glisser-déposer pour réordonner.
  3. **Totaux** : HT, TVA 20 %, TTC, plus la marge totale (éditeur seulement). Une marge négative (ligne ou total) affiche une alerte rouge et demande une confirmation explicite avant l'export PDF.
- **Option location** (case à cocher) : durée (parmi celles de la base taux), partenaire actif ou « Meilleur coefficient » par défaut. Affiche coefficient, loyer mensuel ou trimestriel, coût total et frais de dossier. Si le montant est hors tranches : message clair, pas de loyer.
- **PDF** : reprend la mise en page de la « Fiche devis » : logo et mentions de la marque, tableau, totaux, « Sous réserve d'acceptation du comité Groupe Cybertek », bloc « Bon pour accord », conditions en pied de page (délai, garantie, pénalités, indemnité de 40 €, lien CGV). Encart « Proposition de financement » si la location est cochée, sans le nom du partenaire, avec « Sous réserve d'acceptation du comité de financement ». Nom du fichier : `Devis_Transac_<marque>_<n° devis>_<client>.pdf`.
- **Historique Transac** : filtres par marque, commercial, période et client ; actions Ouvrir, Dupliquer (la copie recalcule la location au tarif actuel ; le n° de devis est vidé et doit être ressaisi) et Exporter PDF.
- **Visibilité** : un commercial voit, modifie et exporte les devis qu'il a créés **et** ceux où il est désigné comme commercial (même règle que pour les contrats). Exemple : un admin prépare un devis au nom de Christophe Besse, et Christophe le retrouve dans son Historique Transac. Les colonnes internes sont visibles par l'auteur, le commercial désigné et les admins, jamais sur le PDF. Seuls l'auteur et les admins peuvent changer le commercial désigné ou supprimer le devis.
- **Admin** : dans l'écran Base taux / Partenaires, un nouvel onglet « Mentions devis transac » permet de modifier, pour chaque marque, le pied de page légal, le contact, le lien CGV et le texte des conditions. Les valeurs fournies ici servent de valeurs par défaut.
- **Conditions par défaut** (reprises de la fiche Excel, modifiables par les admins) : délai de livraison, garantie, pénalités de retard égales à 3 fois le taux d'intérêt légal, indemnité forfaitaire de 40 € pour frais de recouvrement, lien CGV de la marque. La fiche Excel « Fiche devis » n'est pas dans les fichiers du projet : sans elle, je rédige ces conditions à partir de cette liste. Joignez la fiche (ou collez le texte exact) pour une reprise mot pour mot.

## Règles de calcul (testées)

- PU suggéré = prix d'achat / (1 − taux de marque), appliqué automatiquement. S'il est modifié à la main, le taux de marque réel est recalculé : (PU − achat) / PU. Un taux ≥ 100 % est refusé.
- Marge ligne = (PU − achat) × qté ; marge totale = somme ; % = marge / total HT.
- L'éco-participation est **incluse** dans le PU HT (« dont éco-participation : X € ») : elle n'est pas ajoutée une deuxième fois.
- Totaux : HT = somme des lignes ; TVA = HT × 20 % ; TTC = HT + TVA. Tout est arrondi au centime.
- Location : montant financé = total HT ; coefficient via les fonctions existantes `lookupBaseTauxRowIn` / `lookupCoefficientIn` ; frais de dossier via `getFraisDossierIn` (tranche, sinon partenaire). « Meilleur coefficient » = coefficient le plus bas parmi les partenaires actifs ayant une tranche couvrant le montant et la durée. Loyer mensuel = montant × coefficient ; trimestriel = 3 × mensuel ; coût total = loyer × nombre de périodes.
- Le choix de location (partenaire retenu, coefficient, loyer, frais) est figé à l'enregistrement. À la réouverture, l'ancien tarif est conservé ; la duplication recalcule au tarif actuel.

## Données et droits (SQL à valider avant application)

Aucune donnée existante n'est modifiée. Migration idempotente :

```sql
CREATE TABLE IF NOT EXISTS public.transac_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL CHECK (brand IN ('cybertek-pro','grosbill-pro')),
  quote_number text NOT NULL CHECK (length(btrim(quote_number)) > 0),
  client_number text,
  client_name text,
  quote_date date NOT NULL DEFAULT current_date,
  valid_until date NOT NULL DEFAULT (current_date + 7),
  commercial_id text,
  commercial_name text,
  delivery_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  billing_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  billing_same_as_delivery boolean NOT NULL DEFAULT true,
  comment text,
  total_ht numeric NOT NULL DEFAULT 0,
  total_tva numeric NOT NULL DEFAULT 0,
  total_ttc numeric NOT NULL DEFAULT 0,
  total_purchase numeric NOT NULL DEFAULT 0,
  rental_enabled boolean NOT NULL DEFAULT false,
  rental jsonb,             -- durée, périodicité, partenaire retenu, coefficient, loyer, coût total, frais
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','exported')),
  exported_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transac_quotes_number_idx ON public.transac_quotes (lower(btrim(quote_number)));
CREATE INDEX IF NOT EXISTS transac_quotes_created_by_idx ON public.transac_quotes (created_by);

CREATE TABLE IF NOT EXISTS public.transac_quote_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.transac_quotes(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  line_type text NOT NULL DEFAULT 'product' CHECK (line_type IN ('product','delivery')),
  reference text,
  designation text NOT NULL DEFAULT '',
  eco_participation numeric,
  unit_price_ht numeric NOT NULL DEFAULT 0,
  quantity numeric NOT NULL DEFAULT 1,
  total_ht numeric NOT NULL DEFAULT 0,
  -- internes, jamais imprimés
  purchase_price numeric,
  supplier text,
  supplier_ref text,
  markup_rate numeric
);
CREATE INDEX IF NOT EXISTS transac_quote_lines_quote_idx ON public.transac_quote_lines (quote_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transac_quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transac_quote_lines TO authenticated;
GRANT ALL ON public.transac_quotes, public.transac_quote_lines TO service_role;

ALTER TABLE public.transac_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transac_quote_lines ENABLE ROW LEVEL SECURITY;

-- Accès à un devis : auteur, commercial désigné (même règle que les contrats), ou admin.
CREATE OR REPLACE FUNCTION public.can_access_transac_quote(_quote_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.transac_quotes q
    WHERE q.id = _quote_id
      AND (q.created_by = auth.uid()
           OR public.has_role(auth.uid(), 'admin')
           OR public.can_access_contract(auth.uid(), q.commercial_id, q.commercial_name))
  );
$$;
REVOKE ALL ON FUNCTION public.can_access_transac_quote(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_transac_quote(uuid) TO authenticated;

DROP POLICY IF EXISTS "transac_quotes_select" ON public.transac_quotes;
CREATE POLICY "transac_quotes_select" ON public.transac_quotes FOR SELECT TO authenticated
  USING (created_by = auth.uid()
         OR public.has_role(auth.uid(), 'admin')
         OR public.can_access_contract(auth.uid(), commercial_id, commercial_name));
DROP POLICY IF EXISTS "transac_quotes_insert" ON public.transac_quotes;
CREATE POLICY "transac_quotes_insert" ON public.transac_quotes FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid()
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'commercial')));
DROP POLICY IF EXISTS "transac_quotes_update" ON public.transac_quotes;
CREATE POLICY "transac_quotes_update" ON public.transac_quotes FOR UPDATE TO authenticated
  USING (created_by = auth.uid()
         OR public.has_role(auth.uid(), 'admin')
         OR public.can_access_contract(auth.uid(), commercial_id, commercial_name))
  WITH CHECK (created_by = auth.uid()
         OR public.has_role(auth.uid(), 'admin')
         OR public.can_access_contract(auth.uid(), commercial_id, commercial_name));
-- Suppression : auteur et admins uniquement (le commercial désigné lit, modifie, exporte).
DROP POLICY IF EXISTS "transac_quotes_delete" ON public.transac_quotes;
CREATE POLICY "transac_quotes_delete" ON public.transac_quotes FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Lignes : mêmes droits que le devis parent (auteur, commercial désigné, admin).
DROP POLICY IF EXISTS "transac_lines_all" ON public.transac_quote_lines;
CREATE POLICY "transac_lines_all" ON public.transac_quote_lines FOR ALL TO authenticated
  USING (public.can_access_transac_quote(quote_id))
  WITH CHECK (public.can_access_transac_quote(quote_id));

-- Garde-fous : l'auteur ne change jamais (sauf admin) ; le commercial désigné
-- ne peut être changé que par l'auteur ou un admin.
CREATE OR REPLACE FUNCTION public.transac_quotes_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF NEW.created_by IS DISTINCT FROM OLD.created_by AND NOT _is_admin THEN
    RAISE EXCEPTION 'created_by is immutable';
  END IF;
  IF (NEW.commercial_id IS DISTINCT FROM OLD.commercial_id
      OR NEW.commercial_name IS DISTINCT FROM OLD.commercial_name)
     AND NOT _is_admin AND OLD.created_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'only the author or an admin can change the assigned commercial';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS transac_quotes_guard ON public.transac_quotes;
CREATE TRIGGER transac_quotes_guard BEFORE UPDATE ON public.transac_quotes
  FOR EACH ROW EXECUTE FUNCTION public.transac_quotes_guard();

-- Doublon de n° : répond oui/non sans exposer le devis d'un autre commercial.
CREATE OR REPLACE FUNCTION public.transac_quote_number_exists(_number text, _exclude_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.transac_quotes
    WHERE lower(btrim(quote_number)) = lower(btrim(_number))
      AND (_exclude_id IS NULL OR id <> _exclude_id));
$$;
REVOKE ALL ON FUNCTION public.transac_quote_number_exists(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transac_quote_number_exists(text, uuid) TO authenticated;
```

Les mentions par marque sont stockées dans la table de réglages existante `admin_settings` (clés `transac_brand_cybertek-pro` et `transac_brand_grosbill-pro`, JSON), écrites seulement quand un admin enregistre. Aucune migration n'est nécessaire pour cela ; sans réglage, les valeurs par défaut du code sont utilisées.

## Détails techniques

- `src/lib/transac-calculations.ts` (pur) : PU suggéré, taux réel, marges, totaux, `computeTransacRental()` qui s'appuie sur `lookupBaseTauxRowIn` / `lookupCoefficientIn` / `getFraisDossierIn` de `src/lib/partners.ts` et sur les caches partenaires/base taux existants ; sélection du meilleur coefficient.
- `src/lib/transac-html-generator.ts` : reçoit un **modèle d'impression** construit par `toPrintModel()`, qui ne contient que les champs visibles. Les champs internes sont donc absents du HTML par construction. Rendu A4 en `.page-sheet`, puis `htmlToPdfBlob`. Texte assaini (échappement, et DOMPurify pour l'aperçu).
- `src/lib/transac-brands.ts` : valeurs par défaut des deux marques (logo cbpro existant / `grosbill-color.svg`) et fusion avec les réglages admin.
- `src/stores/transacQuoteStore.ts` (brouillon en cours conservé localement) ; `src/hooks/useTransacQuotes.ts` (liste, enregistrement devis et lignes, duplication, vérification du doublon par RPC).
- Composants `src/components/transac/` : `TransacQuoteEditor`, `TransacLinesTable` (glisser-déposer comme dans Nos Options), `TransacRentalPanel`, `TransacPreview`, `TransacHistoryView`, `TransacBrandSettings`.
- `AppSidebar.tsx` / `Index.tsx` : vues `transac-proposal` et `transac-history`.
- Tests Vitest `src/lib/transac-calculations.test.ts` et `src/lib/transac-html-generator.test.ts` : PU suggéré et taux réel, marge négative ligne et total, totaux/TVA arrondis, loyer mensuel et trimestriel, coût total et frais de dossier via la base taux (dont Franfinance tranche 1 → 60 €), meilleur coefficient, hors tranche → pas de loyer, absence des prix d'achat, grossistes, réf. fournisseur et taux dans le HTML exporté.
- Règle ajoutée à `AGENTS.md` : l'impression des devis transac passe uniquement par le modèle d'impression filtré.

## Décisions validées

- L'éco-participation est incluse dans le PU (et non ajoutée en plus).
- Location : mensuelle par défaut, trimestrielle au choix.
- Pas de statut « signé » ni de conversion en contrat pour l'instant.
- La duplication vide le n° de devis.
- Tests de droits ajoutés : le commercial désigné voit et modifie le devis, un autre commercial ne le voit pas, seuls l'auteur ou un admin changent le commercial désigné.
