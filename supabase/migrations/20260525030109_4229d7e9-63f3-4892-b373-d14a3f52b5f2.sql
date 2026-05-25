
ALTER TABLE public.membership_plans
  ADD COLUMN IF NOT EXISTS max_restaurants integer NOT NULL DEFAULT 1;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS plan_slug text;

ALTER TABLE public.membership_payments
  ADD COLUMN IF NOT EXISTS plan_slug text;

CREATE OR REPLACE FUNCTION public.handle_payment_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    UPDATE public.restaurants
    SET membership_status = 'active',
        membership_ends_at = GREATEST(COALESCE(membership_ends_at, now()), now()) + (NEW.duration_days || ' days')::INTERVAL,
        plan_slug = COALESCE(NEW.plan_slug, plan_slug)
    WHERE id = NEW.restaurant_id;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS membership_payments_on_approval ON public.membership_payments;
CREATE TRIGGER membership_payments_on_approval
AFTER UPDATE ON public.membership_payments
FOR EACH ROW EXECUTE FUNCTION public.handle_payment_approval();
