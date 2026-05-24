-- 1. Fix mutable search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- 2. Revoke EXECUTE on SECURITY DEFINER functions that should not be callable via API
-- (still usable inside RLS policies and triggers because those run as the function owner)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.restaurant_is_active(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_payment_approval() FROM anon, authenticated, public;
-- claim_admin_if_none must remain callable by authenticated users (first-admin bootstrap)
REVOKE EXECUTE ON FUNCTION public.claim_admin_if_none() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_none() TO authenticated;

-- 3. Storage: remove broad SELECT policies so anonymous clients can't list bucket contents.
-- Public buckets still serve individual files via their public URL (CDN path bypasses RLS).
DROP POLICY IF EXISTS "Public read restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Public read menu images" ON storage.objects;

-- 4. Remove the Resend API key from the database — it now lives in env (RESEND_API_KEY).
ALTER TABLE public.app_settings DROP COLUMN IF EXISTS resend_api_key;
ALTER TABLE public.app_settings DROP COLUMN IF EXISTS resend_from;