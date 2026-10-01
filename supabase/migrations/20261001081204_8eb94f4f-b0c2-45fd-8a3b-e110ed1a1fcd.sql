GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_partners TO authenticated;
GRANT ALL ON public.financial_partners TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.base_taux TO authenticated;
GRANT ALL ON public.base_taux TO service_role;