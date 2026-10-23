CREATE OR REPLACE FUNCTION public.enforce_notification_identity()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN RAISE EXCEPTION 'only_is_read_can_change'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_notification_identity ON public.notifications;
CREATE TRIGGER trg_enforce_notification_identity BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.enforce_notification_identity();