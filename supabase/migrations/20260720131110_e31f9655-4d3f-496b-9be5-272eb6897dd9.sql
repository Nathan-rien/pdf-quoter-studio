DROP POLICY IF EXISTS "Users can view own proposals"   ON public.proposal_exports;
DROP POLICY IF EXISTS "Users can update own proposals" ON public.proposal_exports;
DROP POLICY IF EXISTS "Users can delete own proposals" ON public.proposal_exports;

CREATE POLICY "Users can view own proposals" ON public.proposal_exports
FOR SELECT USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR commercial_id = public.get_user_commercial_id(auth.uid())
);

CREATE POLICY "Users can update own proposals" ON public.proposal_exports
FOR UPDATE USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR commercial_id = public.get_user_commercial_id(auth.uid())
)
WITH CHECK (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR commercial_id = public.get_user_commercial_id(auth.uid())
);

CREATE POLICY "Users can delete own proposals" ON public.proposal_exports
FOR DELETE USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);