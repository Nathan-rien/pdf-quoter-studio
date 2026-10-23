REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;