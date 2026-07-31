
REVOKE EXECUTE ON FUNCTION public.recompute_customer_tier(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.orders_recompute_tier() FROM PUBLIC, anon, authenticated;
