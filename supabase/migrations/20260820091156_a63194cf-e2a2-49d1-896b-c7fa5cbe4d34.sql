REVOKE EXECUTE ON FUNCTION public.get_user_commercial_name(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_contract(uuid, text, text) FROM anon, authenticated;