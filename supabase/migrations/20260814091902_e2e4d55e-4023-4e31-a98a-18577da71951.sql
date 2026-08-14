CREATE TABLE public.remote_support_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bu text,
  commercial_name text,
  entity text NOT NULL,
  client_number text,
  order_number text,
  invoice_number text,
  forfait text,
  tickets_label text,
  tickets_initial integer,
  tickets_remaining integer,
  attribution text,
  machines_count integer,
  products_sn text,
  start_date date,
  end_date date,
  is_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.remote_support_clients TO authenticated;
GRANT ALL ON public.remote_support_clients TO service_role;

ALTER TABLE public.remote_support_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rsc_select_authenticated" ON public.remote_support_clients
FOR SELECT TO authenticated USING (true);

CREATE POLICY "rsc_insert_admin_tech" ON public.remote_support_clients
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technicien'));

CREATE POLICY "rsc_update_admin_tech" ON public.remote_support_clients
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technicien'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technicien'));

CREATE POLICY "rsc_delete_admin" ON public.remote_support_clients
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_rsc_updated_at
BEFORE UPDATE ON public.remote_support_clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.remote_support_ticket_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.remote_support_clients(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now(),
  used_by uuid,
  used_by_name text,
  note text
);

GRANT SELECT ON public.remote_support_ticket_log TO authenticated;
GRANT ALL ON public.remote_support_ticket_log TO service_role;

ALTER TABLE public.remote_support_ticket_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rstl_select_authenticated" ON public.remote_support_ticket_log
FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.consume_remote_support_ticket(_client_id uuid, _note text DEFAULT NULL)
RETURNS public.remote_support_clients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.remote_support_clients;
  v_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT (public.has_role(v_uid, 'admin') OR public.has_role(v_uid, 'technicien')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_row FROM public.remote_support_clients WHERE id = _client_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'client_not_found';
  END IF;

  IF v_row.tickets_remaining IS NULL THEN
    RAISE EXCEPTION 'not_a_ticket_service';
  END IF;

  IF v_row.tickets_remaining <= 0 THEN
    RAISE EXCEPTION 'quota_exhausted';
  END IF;

  UPDATE public.remote_support_clients
     SET tickets_remaining = tickets_remaining - 1,
         updated_at = now()
   WHERE id = _client_id
   RETURNING * INTO v_row;

  SELECT COALESCE(full_name, email) INTO v_name FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.remote_support_ticket_log(client_id, used_by, used_by_name, note)
  VALUES (_client_id, v_uid, v_name, _note);

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_remote_support_ticket(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_remote_support_ticket(uuid, text) TO authenticated;