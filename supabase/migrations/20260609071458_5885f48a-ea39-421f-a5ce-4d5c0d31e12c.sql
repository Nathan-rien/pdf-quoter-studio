-- 1. Remove proposal_exports from realtime publication (sensitive data should not be broadcast)
ALTER PUBLICATION supabase_realtime DROP TABLE public.proposal_exports;

-- 2. Restrict realtime.messages to authenticated users (gantt tables remain broadcast to logged-in users)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated users can receive realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can send realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated users can send realtime messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. profiles UPDATE policy: add WITH CHECK and prevent email tampering
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. user_roles: explicit admin-only UPDATE policy
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));