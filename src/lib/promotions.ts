export type PromotionType = "flash_sale" | "happy_hour" | "buy_x_get_y" | "tier_discount";

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  store_id: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  daily_start_min: number | null;
  daily_end_min: number | null;
  weekdays: number[] | null;
  discount_percent: number;
  max_discount_amount: number | null;
  product_ids: string[] | null;
  buy_qty: number | null;
  get_qty: number | null;
  tier_name: string | null;
  priority: number;
  is_qiclub_synced?: boolean;
  qiclub_prefix?: string | null;
  qiclub_subsidy_ratio?: number;
  company_subsidy_ratio?: number;
  store_subsidy_ratio?: number;
}

export interface CartLine {
  product_id: string;
  unit_price: number;
  qty: number;
}

export const PROMO_TYPE_LABEL: Record<PromotionType, string> = {
  flash_sale: "Flash Sale",
  happy_hour: "Happy Hour",
  buy_x_get_y: "Mua X tặng Y",
  tier_discount: "Giảm theo hạng",
};

export function minutesToHHMM(min: number | null | undefined): string {
  if (min == null) return "";
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function hhmmToMinutes(v: string): number | null {
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Is a promotion currently in effect for the given store and time? */
export function isPromotionActiveNow(
  p: Promotion,
  opts: { storeId?: string | null; now?: Date } = {},
): boolean {
  if (!p.is_active) return false;
  const now = opts.now ?? new Date();
  if (p.store_id && opts.storeId && p.store_id !== opts.storeId) return false;
  if (p.starts_at && new Date(p.starts_at) > now) return false;
  if (p.ends_at && new Date(p.ends_at) < now) return false;
  if (p.weekdays && p.weekdays.length > 0 && !p.weekdays.includes(now.getDay())) return false;
  if (p.daily_start_min != null && p.daily_end_min != null) {
    const cur = now.getHours() * 60 + now.getMinutes();
    if (cur < p.daily_start_min || cur > p.daily_end_min) return false;
  }
  return true;
}

function matchesProduct(p: Promotion, productId: string): boolean {
  return !p.product_ids || p.product_ids.length === 0 || p.product_ids.includes(productId);
}

export interface AppliedPromotion {
  id: string;
  name: string;
  type: PromotionType;
  discount: number;
}

export interface PromotionResult {
  discount: number;
  applied: AppliedPromotion[];
}

/**
 * Computes the total automatic-promotion discount for a cart.
 * Promotions stack additively but the total is capped at the cart subtotal.
 */
export function computePromotions(
  lines: CartLine[],
  promotions: Promotion[],
  opts: { storeId?: string | null; tier?: string | null; now?: Date } = {},
): PromotionResult {
  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.qty, 0);
  const active = promotions
    .filter((p) => isPromotionActiveNow(p, opts))
    .sort((a, b) => b.priority - a.priority);

  const applied: AppliedPromotion[] = [];

  for (const p of active) {
    let discount = 0;
    const matched = lines.filter((l) => matchesProduct(p, l.product_id));
    const matchedSubtotal = matched.reduce((s, l) => s + l.unit_price * l.qty, 0);

    if (p.type === "flash_sale" || p.type === "happy_hour") {
      discount = (matchedSubtotal * p.discount_percent) / 100;
    } else if (p.type === "tier_discount") {
      if (!p.tier_name || (opts.tier && opts.tier === p.tier_name)) {
        discount = (matchedSubtotal * p.discount_percent) / 100;
      }
    } else if (p.type === "buy_x_get_y") {
      const buy = p.buy_qty ?? 0;
      const get = p.get_qty ?? 0;
      if (buy > 0 && get > 0) {
        for (const l of matched) {
          const groups = Math.floor(l.qty / (buy + get));
          discount += groups * get * l.unit_price;
        }
      }
    }

    if (p.max_discount_amount != null) discount = Math.min(discount, p.max_discount_amount);
    discount = Math.round(discount);
    if (discount > 0) applied.push({ id: p.id, name: p.name, type: p.type, discount });
  }

  const total = Math.min(
    applied.reduce((s, a) => s + a.discount, 0),
    subtotal,
  );
  return { discount: total, applied };
}
