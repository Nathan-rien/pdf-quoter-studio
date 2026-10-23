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
  rental jsonb,
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
DROP POLICY IF EXISTS "transac_quotes_delete" ON public.transac_quotes;
CREATE POLICY "transac_quotes_delete" ON public.transac_quotes FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "transac_lines_all" ON public.transac_quote_lines;
CREATE POLICY "transac_lines_all" ON public.transac_quote_lines FOR ALL TO authenticated
  USING (public.can_access_transac_quote(quote_id))
  WITH CHECK (public.can_access_transac_quote(quote_id));

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

CREATE OR REPLACE FUNCTION public.transac_quote_number_exists(_number text, _exclude_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.transac_quotes
    WHERE lower(btrim(quote_number)) = lower(btrim(_number))
      AND (_exclude_id IS NULL OR id <> _exclude_id));
$$;
REVOKE ALL ON FUNCTION public.transac_quote_number_exists(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transac_quote_number_exists(text, uuid) TO authenticated;