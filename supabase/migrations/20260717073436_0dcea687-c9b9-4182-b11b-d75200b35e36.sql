
CREATE TYPE public.intervention_status AS ENUM ('prevue', 'realisee', 'annulee');

CREATE TABLE public.intervention_planning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL REFERENCES public.client_service_references(id) ON DELETE CASCADE,
  technician_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  technician_name text NOT NULL,
  date_intervention timestamptz NOT NULL,
  duree_estimee_minutes integer,
  statut public.intervention_status NOT NULL DEFAULT 'prevue',
  commentaire text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.intervention_planning TO authenticated;
GRANT ALL ON public.intervention_planning TO service_role;

ALTER TABLE public.intervention_planning ENABLE ROW LEVEL SECURITY;

-- Read: admins + technicians
CREATE POLICY "Admins and technicians can view interventions"
ON public.intervention_planning
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technicien')
);

-- Insert: admins + technicians; must set created_by = self
CREATE POLICY "Admins and technicians can create interventions"
ON public.intervention_planning
FOR INSERT
TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technicien'))
  AND created_by = auth.uid()
);

-- Update: admin can update any; creator can update any field of their own;
-- other technicians can only update rows created by others (status changes handled by same policy — we allow update for admin/tech but restrict full modifications at app-level)
-- To enforce "others can only cancel": admin OR creator can update freely; a non-creator technician can update but WITH CHECK restricts them to only changing statut. We enforce that via trigger.
CREATE POLICY "Admins and technicians can update interventions"
ON public.intervention_planning
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technicien')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technicien')
);

-- Trigger to restrict non-owner technicians to only changing "statut"
CREATE OR REPLACE FUNCTION public.enforce_intervention_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF OLD.created_by = auth.uid() THEN
    RETURN NEW;
  END IF;

  -- Non-owner technician: only statut may change
  IF NEW.reference_id IS DISTINCT FROM OLD.reference_id
     OR NEW.technician_user_id IS DISTINCT FROM OLD.technician_user_id
     OR NEW.technician_name IS DISTINCT FROM OLD.technician_name
     OR NEW.date_intervention IS DISTINCT FROM OLD.date_intervention
     OR NEW.duree_estimee_minutes IS DISTINCT FROM OLD.duree_estimee_minutes
     OR NEW.commentaire IS DISTINCT FROM OLD.commentaire
     OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'not_owner_can_only_change_status';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_intervention_update_scope
BEFORE UPDATE ON public.intervention_planning
FOR EACH ROW EXECUTE FUNCTION public.enforce_intervention_update_scope();

-- Delete: only admin or creator
CREATE POLICY "Admin or creator can delete interventions"
ON public.intervention_planning
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR created_by = auth.uid()
);

CREATE TRIGGER update_intervention_planning_updated_at
BEFORE UPDATE ON public.intervention_planning
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_intervention_planning_date ON public.intervention_planning(date_intervention);
CREATE INDEX idx_intervention_planning_reference ON public.intervention_planning(reference_id);
