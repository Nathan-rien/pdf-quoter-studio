DROP POLICY IF EXISTS "Users can create own proposals" ON public.proposal_exports;
CREATE POLICY "Users can create own proposals"
ON public.proposal_exports
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own proposals" ON public.proposal_exports;
CREATE POLICY "Users can delete own proposals"
ON public.proposal_exports
FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can update own proposals" ON public.proposal_exports;
CREATE POLICY "Users can update own proposals"
ON public.proposal_exports
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own proposals" ON public.proposal_exports;
CREATE POLICY "Users can view own proposals"
ON public.proposal_exports
FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));