
-- Helper: map auth user -> commercial_id (text slug) via email in pre_registered_commercials
CREATE OR REPLACE FUNCTION public.get_user_commercial_id(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT prc.commercial_id
  FROM public.pre_registered_commercials prc
  JOIN auth.users u ON lower(u.email) = lower(prc.email)
  WHERE u.id = _user_id
  LIMIT 1
$$;

-- 1) edi_import_lines: enable RLS, admin-only
ALTER TABLE public.edi_import_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "edi_import_lines_admin_all" ON public.edi_import_lines;
CREATE POLICY "edi_import_lines_admin_all"
  ON public.edi_import_lines
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) contracts: scope to owning commercial or admin
DROP POLICY IF EXISTS contracts_select_authenticated ON public.contracts;
DROP POLICY IF EXISTS contracts_insert_authenticated ON public.contracts;
DROP POLICY IF EXISTS contracts_update_admin ON public.contracts;
DROP POLICY IF EXISTS contracts_delete_admin ON public.contracts;

CREATE POLICY contracts_select_owner_or_admin
  ON public.contracts
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR commercial_id = public.get_user_commercial_id(auth.uid())
  );

CREATE POLICY contracts_insert_owner_or_admin
  ON public.contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR commercial_id = public.get_user_commercial_id(auth.uid())
  );

CREATE POLICY contracts_update_owner_or_admin
  ON public.contracts
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR commercial_id = public.get_user_commercial_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR commercial_id = public.get_user_commercial_id(auth.uid())
  );

CREATE POLICY contracts_delete_admin
  ON public.contracts
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) service_proposals: scope to owning commercial or admin
DROP POLICY IF EXISTS service_proposals_select ON public.service_proposals;
DROP POLICY IF EXISTS service_proposals_insert ON public.service_proposals;
DROP POLICY IF EXISTS service_proposals_update ON public.service_proposals;
DROP POLICY IF EXISTS service_proposals_delete ON public.service_proposals;

CREATE POLICY service_proposals_select
  ON public.service_proposals
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR commercial_id = public.get_user_commercial_id(auth.uid())
  );

CREATE POLICY service_proposals_insert
  ON public.service_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR commercial_id = public.get_user_commercial_id(auth.uid())
  );

CREATE POLICY service_proposals_update
  ON public.service_proposals
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR commercial_id = public.get_user_commercial_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR commercial_id = public.get_user_commercial_id(auth.uid())
  );

CREATE POLICY service_proposals_delete
  ON public.service_proposals
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR commercial_id = public.get_user_commercial_id(auth.uid())
  );

-- 4) storage: restrict contract-attachments to owning commercial or admin
DROP POLICY IF EXISTS "Authenticated can read contract attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload contract attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update contract attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete contract attachments" ON storage.objects;

CREATE POLICY "Contract attachments read owner or admin"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contract-attachments'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.id::text = (storage.foldername(name))[2]
          AND c.commercial_id = public.get_user_commercial_id(auth.uid())
      )
    )
  );

CREATE POLICY "Contract attachments insert owner or admin"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contract-attachments'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.id::text = (storage.foldername(name))[2]
          AND c.commercial_id = public.get_user_commercial_id(auth.uid())
      )
    )
  );

CREATE POLICY "Contract attachments update owner or admin"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'contract-attachments'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.id::text = (storage.foldername(name))[2]
          AND c.commercial_id = public.get_user_commercial_id(auth.uid())
      )
    )
  )
  WITH CHECK (
    bucket_id = 'contract-attachments'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.id::text = (storage.foldername(name))[2]
          AND c.commercial_id = public.get_user_commercial_id(auth.uid())
      )
    )
  );

CREATE POLICY "Contract attachments delete owner or admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contract-attachments'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.id::text = (storage.foldername(name))[2]
          AND c.commercial_id = public.get_user_commercial_id(auth.uid())
      )
    )
  );
