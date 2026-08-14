DROP POLICY IF EXISTS contracts_select_owner_or_admin ON public.contracts;
CREATE POLICY contracts_select_owner_or_admin ON public.contracts
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'technicien'::app_role)
  OR commercial_id = get_user_commercial_id(auth.uid())
);

DROP POLICY IF EXISTS csr_insert_admin ON public.client_service_references;
CREATE POLICY csr_insert_admin_tech ON public.client_service_references
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'technicien'::app_role)
);

DROP POLICY IF EXISTS csr_update_admin ON public.client_service_references;
CREATE POLICY csr_update_admin_tech ON public.client_service_references
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'technicien'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'technicien'::app_role)
);