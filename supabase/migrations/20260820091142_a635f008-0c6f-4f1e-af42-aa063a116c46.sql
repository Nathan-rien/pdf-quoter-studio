CREATE OR REPLACE FUNCTION public.get_user_commercial_name(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT prc.full_name
       FROM public.pre_registered_commercials prc
       JOIN auth.users u ON lower(u.email) = lower(prc.email)
      WHERE u.id = _user_id
      LIMIT 1),
    (SELECT p.full_name FROM public.profiles p WHERE p.id = _user_id)
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_contract(_user_id uuid, _commercial_id text, _commercial_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR (
        public.has_role(_user_id, 'commercial')
        AND (
          _commercial_id = public.get_user_commercial_id(_user_id)
          OR (
            _commercial_name IS NOT NULL
            AND public.get_user_commercial_name(_user_id) IS NOT NULL
            AND lower(btrim(_commercial_name)) = lower(btrim(public.get_user_commercial_name(_user_id)))
          )
        )
      )
$$;

DROP POLICY IF EXISTS contracts_select_owner_or_admin ON public.contracts;
CREATE POLICY contracts_select_owner_or_admin ON public.contracts
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'technicien')
  OR public.can_access_contract(auth.uid(), commercial_id, commercial_name)
);

DROP POLICY IF EXISTS contracts_update_owner_or_admin ON public.contracts;
CREATE POLICY contracts_update_owner_or_admin ON public.contracts
FOR UPDATE TO authenticated
USING (public.can_access_contract(auth.uid(), commercial_id, commercial_name))
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'commercial')
);

DROP POLICY IF EXISTS contracts_insert_owner_or_admin ON public.contracts;
CREATE POLICY contracts_insert_owner_or_admin ON public.contracts
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'commercial')
);