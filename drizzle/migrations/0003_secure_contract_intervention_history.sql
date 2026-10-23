CREATE OR REPLACE FUNCTION public.get_contract_interventions(_contract_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(i) || jsonb_build_object('resolved_service_label', r.service_label) ORDER BY i.date_intervention DESC), '[]'::jsonb)
  FROM public.intervention_planning i
  LEFT JOIN public.client_service_references r ON r.id = i.reference_id
  WHERE i.contract_id = _contract_id AND auth.uid() IS NOT NULL
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technicien')
      OR EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = _contract_id AND public.can_access_contract(auth.uid(), c.commercial_id, c.commercial_name)))
$$;
REVOKE EXECUTE ON FUNCTION public.get_contract_interventions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_contract_interventions(uuid) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.enforce_intervention_contract_update_scope()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.contract_id IS DISTINCT FROM OLD.contract_id AND NOT public.has_role(auth.uid(), 'admin') AND OLD.created_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_owner_can_only_change_status';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_intervention_contract_update_scope ON public.intervention_planning;
CREATE TRIGGER trg_enforce_intervention_contract_update_scope BEFORE UPDATE ON public.intervention_planning FOR EACH ROW EXECUTE FUNCTION public.enforce_intervention_contract_update_scope();