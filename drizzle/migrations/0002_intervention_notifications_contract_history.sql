-- 1. Lien intervention -> contrat
ALTER TABLE public.intervention_planning
  ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_intervention_planning_contract_id ON public.intervention_planning(contract_id);

CREATE OR REPLACE FUNCTION public.set_intervention_contract_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.reference_id IS NOT NULL THEN
    SELECT contract_id INTO NEW.contract_id FROM public.client_service_references WHERE id = NEW.reference_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_intervention_contract_id ON public.intervention_planning;
CREATE TRIGGER trg_set_intervention_contract_id
  BEFORE INSERT OR UPDATE OF reference_id, contract_id ON public.intervention_planning
  FOR EACH ROW EXECUTE FUNCTION public.set_intervention_contract_id();

-- Rattrapage : remplit uniquement la nouvelle colonne
UPDATE public.intervention_planning ip
   SET contract_id = csr.contract_id
  FROM public.client_service_references csr
 WHERE ip.reference_id = csr.id AND ip.contract_id IS NULL;

-- 2. Table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  contract_id uuid,
  intervention_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users mark own notifications" ON public.notifications;
CREATE POLICY "Users mark own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Seul is_read est modifiable par l'utilisateur
CREATE OR REPLACE FUNCTION public.enforce_notification_read_only()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.title IS DISTINCT FROM OLD.title OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.link IS DISTINCT FROM OLD.link OR NEW.contract_id IS DISTINCT FROM OLD.contract_id
     OR NEW.intervention_id IS DISTINCT FROM OLD.intervention_id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'only_is_read_can_change';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_notification_read_only ON public.notifications;
CREATE TRIGGER trg_enforce_notification_read_only
  BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.enforce_notification_read_only();

-- Point d'entrée unique (futur branchement email ici)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid, _type text, _title text, _message text, _link text,
  _contract_id uuid DEFAULT NULL, _intervention_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.notifications(user_id, type, title, message, link, contract_id, intervention_id)
  VALUES (_user_id, _type, _title, _message, _link, _contract_id, _intervention_id)
  RETURNING id INTO v_id;
  -- TODO email (Resend) : brancher l'envoi ici plus tard
  RETURN v_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,text,uuid,uuid) FROM PUBLIC, anon, authenticated;

-- Résolution commercial du contrat -> compte utilisateur (NULL si non identifié)
CREATE OR REPLACE FUNCTION public.normalize_person_name(_n text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(lower(regexp_replace(btrim(coalesce(_n,'')), '\s+', ' ', 'g')), '')
$$;

CREATE OR REPLACE FUNCTION public.resolve_contract_commercial_user(_contract_id uuid)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cid text; v_name text; v_uid uuid; v_count int;
BEGIN
  SELECT commercial_id, public.normalize_person_name(commercial_name) INTO v_cid, v_name
    FROM public.contracts WHERE id = _contract_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- a) par identifiant commercial -> email -> compte
  IF v_cid IS NOT NULL AND v_cid <> 'quick' THEN
    SELECT u.id INTO v_uid FROM public.pre_registered_commercials prc
      JOIN auth.users u ON lower(u.email) = lower(prc.email)
     WHERE prc.commercial_id = v_cid LIMIT 1;
    IF v_uid IS NOT NULL THEN RETURN v_uid; END IF;
  END IF;

  -- b) nom complet exact (>= 2 mots) et unique
  IF v_name IS NULL OR position(' ' in v_name) = 0 THEN RETURN NULL; END IF;
  SELECT count(DISTINCT uid), min(uid::text)::uuid INTO v_count, v_uid FROM (
    SELECT u.id uid FROM public.pre_registered_commercials prc
      JOIN auth.users u ON lower(u.email) = lower(prc.email)
     WHERE public.normalize_person_name(prc.full_name) = v_name
    UNION
    SELECT p.id FROM public.profiles p WHERE public.normalize_person_name(p.full_name) = v_name
  ) s;
  IF v_count = 1 THEN RETURN v_uid; END IF;
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.resolve_contract_commercial_user(uuid) FROM PUBLIC, anon, authenticated;

-- Trigger de notification sur interventions
CREATE OR REPLACE FUNCTION public.notify_intervention_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_type text; v_title text; v_msg text; v_link text; v_uid uuid; v_prefix text := '';
  v_client text; v_service text; v_admin record;
  v_row public.intervention_planning;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_row := OLD;
  ELSE
    v_row := NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    v_type := 'intervention_deleted'; v_title := 'Intervention supprimée';
  ELSIF TG_OP = 'INSERT' THEN
    v_type := 'intervention_created'; v_title := 'Intervention planifiée';
  ELSIF NEW.statut = 'annulee' AND OLD.statut IS DISTINCT FROM 'annulee' THEN
    v_type := 'intervention_cancelled'; v_title := 'Intervention annulée';
  ELSIF NEW.date_intervention IS DISTINCT FROM OLD.date_intervention THEN
    v_type := 'intervention_rescheduled'; v_title := 'Intervention replanifiée';
  ELSE
    RETURN NEW;
  END IF;

  SELECT c.client_name INTO v_client FROM public.contracts c WHERE c.id = v_row.contract_id;
  SELECT service_label INTO v_service FROM public.client_service_references WHERE id = v_row.reference_id;
  v_client := coalesce(v_client, v_row.client_name, 'Client ?');
  v_service := coalesce(v_service, v_row.service_label, 'Prestation non précisée');

  v_msg := v_client || ' · ' || v_service || ' · ' || v_row.technician_name || ' · '
        || to_char(v_row.date_intervention AT TIME ZONE 'Europe/Paris', 'DD/MM/YYYY HH24:MI');
  IF v_type = 'intervention_rescheduled' THEN
    v_msg := v_msg || ' (au lieu du ' || to_char(OLD.date_intervention AT TIME ZONE 'Europe/Paris', 'DD/MM/YYYY HH24:MI') || ')';
  END IF;

  IF v_row.contract_id IS NULL THEN
    v_prefix := '[hors contrat] ';
    v_link := NULL;
  ELSE
    v_link := '/?view=service-contracts&contract=' || v_row.contract_id::text;
    v_uid := public.resolve_contract_commercial_user(v_row.contract_id);
    IF v_uid IS NULL THEN v_prefix := '[commercial non identifié] '; END IF;
  END IF;

  IF v_uid IS NOT NULL THEN
    PERFORM public.create_notification(v_uid, v_type, v_title, v_msg, v_link, v_row.contract_id, v_row.id);
  ELSE
    FOR v_admin IN SELECT DISTINCT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      PERFORM public.create_notification(v_admin.user_id, v_type, v_prefix || v_title, v_msg, v_link, v_row.contract_id, v_row.id);
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_intervention_change ON public.intervention_planning;
CREATE TRIGGER trg_notify_intervention_change
  AFTER INSERT OR UPDATE OR DELETE ON public.intervention_planning
  FOR EACH ROW EXECUTE FUNCTION public.notify_intervention_change();

-- 3. Lecture des interventions par le commercial du contrat
DROP POLICY IF EXISTS "Commercials view interventions of their contracts" ON public.intervention_planning;
CREATE POLICY "Commercials view interventions of their contracts" ON public.intervention_planning
  FOR SELECT TO authenticated
  USING (contract_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.contracts c WHERE c.id = contract_id
      AND public.can_access_contract(auth.uid(), c.commercial_id, c.commercial_name)));
