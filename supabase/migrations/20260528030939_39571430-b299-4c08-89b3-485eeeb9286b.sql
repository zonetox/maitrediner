REVOKE EXECUTE ON FUNCTION public.claim_admin_if_none() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_none() TO authenticated;