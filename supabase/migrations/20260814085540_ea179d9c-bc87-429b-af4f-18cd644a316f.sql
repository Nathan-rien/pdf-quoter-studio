UPDATE public.client_service_references r
SET requires_intervention = o.requires_intervention,
    option_service_id = COALESCE(r.option_service_id, o.id)
FROM public.options_services o
WHERE (r.option_service_id = o.id OR (r.option_service_id IS NULL AND r.service_label = o.title))
  AND r.requires_intervention IS DISTINCT FROM o.requires_intervention;