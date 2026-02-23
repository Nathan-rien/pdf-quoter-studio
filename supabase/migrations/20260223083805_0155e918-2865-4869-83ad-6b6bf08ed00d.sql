-- Fix overly permissive RLS policy on pre_registered_commercials
DROP POLICY IF EXISTS "Trigger function can read pre_registered_commercials" ON pre_registered_commercials;

CREATE POLICY "Admins or own email can read pre_registered"
  ON pre_registered_commercials FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR lower(email) = lower(auth.jwt()->>'email')
  );