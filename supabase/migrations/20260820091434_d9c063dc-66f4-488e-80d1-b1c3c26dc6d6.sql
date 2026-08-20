DROP POLICY IF EXISTS contracts_update_owner_or_admin ON public.contracts;
DROP POLICY IF EXISTS contracts_update_admin ON public.contracts;
CREATE POLICY contracts_update_admin ON public.contracts
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));