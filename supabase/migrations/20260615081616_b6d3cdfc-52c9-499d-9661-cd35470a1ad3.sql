-- Reverse logistics: safely restock a fashion variant when a return is accepted back into inventory
CREATE OR REPLACE FUNCTION public.restock_fashion_variant(_variant_id uuid, _qty integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
  v_new_stock integer;
BEGIN
  IF _qty IS NULL OR _qty <= 0 THEN
    RAISE EXCEPTION 'Số lượng hoàn kho phải lớn hơn 0';
  END IF;

  SELECT tenant_id INTO v_tenant FROM public.fashion_variants WHERE id = _variant_id;
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy biến thể sản phẩm';
  END IF;

  -- Only staff of the same tenant may restock
  IF v_tenant IS DISTINCT FROM public.current_tenant_id() OR NOT public.is_tenant_staff() THEN
    RAISE EXCEPTION 'Không có quyền hoàn kho cho biến thể này';
  END IF;

  UPDATE public.fashion_variants
  SET stock = stock + _qty,
      updated_at = now()
  WHERE id = _variant_id
  RETURNING stock INTO v_new_stock;

  RETURN v_new_stock;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restock_fashion_variant(uuid, integer) TO authenticated;