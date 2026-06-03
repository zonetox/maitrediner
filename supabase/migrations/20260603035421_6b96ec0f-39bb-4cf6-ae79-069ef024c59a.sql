
DROP POLICY IF EXISTS "Public read restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Public read menu images" ON storage.objects;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.restaurant_is_active(uuid) FROM authenticated;
