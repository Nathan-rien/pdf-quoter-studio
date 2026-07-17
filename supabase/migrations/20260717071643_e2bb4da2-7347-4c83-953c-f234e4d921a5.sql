
-- client_service_references
CREATE TABLE public.client_service_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  option_service_id uuid REFERENCES public.options_services(id) ON DELETE SET NULL,
  service_label text NOT NULL,
  erp_reference text,
  tickets_initial integer,
  tickets_remaining integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tickets_consistency CHECK (
    (tickets_initial IS NULL AND tickets_remaining IS NULL) OR
    (tickets_initial IS NOT NULL AND tickets_remaining IS NOT NULL
     AND tickets_remaining >= 0 AND tickets_remaining <= tickets_initial)
  )
);

CREATE INDEX idx_csr_contract ON public.client_service_references(contract_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_service_references TO authenticated;
GRANT ALL ON public.client_service_references TO service_role;

ALTER TABLE public.client_service_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "csr_select_admin_tech" ON public.client_service_references
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technicien'));

CREATE POLICY "csr_insert_admin" ON public.client_service_references
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "csr_update_admin" ON public.client_service_references
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "csr_delete_admin" ON public.client_service_references
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_csr_updated_at BEFORE UPDATE ON public.client_service_references
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ticket_usage_log
CREATE TABLE public.ticket_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL REFERENCES public.client_service_references(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now(),
  used_by uuid NOT NULL REFERENCES auth.users(id),
  used_by_name text,
  note text
);

CREATE INDEX idx_tul_reference ON public.ticket_usage_log(reference_id, used_at DESC);

GRANT SELECT, INSERT ON public.ticket_usage_log TO authenticated;
GRANT ALL ON public.ticket_usage_log TO service_role;

ALTER TABLE public.ticket_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tul_select_admin_tech" ON public.ticket_usage_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technicien'));

-- No direct INSERT policy — insertions go through the SECURITY DEFINER function below.

-- consume_ticket RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.consume_ticket(_reference_id uuid, _note text DEFAULT NULL)
RETURNS public.client_service_references
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.client_service_references;
  v_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT (public.has_role(v_uid, 'admin') OR public.has_role(v_uid, 'technicien')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_row FROM public.client_service_references WHERE id = _reference_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'reference_not_found';
  END IF;

  IF v_row.tickets_remaining IS NULL THEN
    RAISE EXCEPTION 'not_a_ticket_service';
  END IF;

  IF v_row.tickets_remaining <= 0 THEN
    RAISE EXCEPTION 'quota_exhausted';
  END IF;

  UPDATE public.client_service_references
     SET tickets_remaining = tickets_remaining - 1,
         updated_at = now()
   WHERE id = _reference_id
   RETURNING * INTO v_row;

  SELECT COALESCE(full_name, email) INTO v_name FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.ticket_usage_log(reference_id, used_by, used_by_name, note)
  VALUES (_reference_id, v_uid, v_name, _note);

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ticket(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ticket(uuid, text) TO authenticated;
