import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertStaff(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"]);
  if (!data || data.length === 0) throw new Error("Không có quyền");
}

// ---------- Campaigns ----------

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { data } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

const campaignInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(150),
  description: z.string().max(1000).nullable().optional(),
  segment: z.enum(["all", "new", "no_purchase", "vip", "inactive"]).default("all"),
  tier_filter: z.string().max(50).nullable().optional(),
  tag_filter: z.string().max(50).nullable().optional(),
  promo_code: z.string().max(50).nullable().optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  status: z.enum(["draft", "active", "ended"]).default("draft"),
  popup_enabled: z.boolean().optional().default(false),
  popup_title: z.string().max(150).nullable().optional(),
  popup_body: z.string().max(1000).nullable().optional(),
  popup_image_url: z.string().max(500).nullable().optional(),
  popup_cta_text: z.string().max(80).nullable().optional(),
  popup_cta_url: z.string().max(500).nullable().optional(),
  popup_dismiss_hours: z.number().int().min(1).max(8760).optional().default(24),
});

export const upsertCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => campaignInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const payload = { ...data, created_by: context.userId };
    if (data.id) {
      const { error } = await supabaseAdmin.from("campaigns").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { id: _ignore, ...insertPayload } = payload;
      const { error } = await supabaseAdmin.from("campaigns").insert(insertPayload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { error } = await supabaseAdmin.from("campaigns").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Marketing Reports ----------

export const getMarketingReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);

    // Promo performance
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("promo_code, total, discount, status, affiliate_id, agent_id, customer_id")
      .eq("status", "paid")
      .limit(2000);

    const promoStats = new Map<string, { uses: number; revenue: number; discount: number }>();
    const affiliateStats = new Map<string, { orders: number; revenue: number }>();
    const customerStats = new Map<string, { orders: number; revenue: number }>();

    (orders ?? []).forEach((o) => {
      if (o.promo_code) {
        const s = promoStats.get(o.promo_code) ?? { uses: 0, revenue: 0, discount: 0 };
        s.uses += 1;
        s.revenue += Number(o.total || 0);
        s.discount += Number(o.discount || 0);
        promoStats.set(o.promo_code, s);
      }
      if (o.affiliate_id) {
        const s = affiliateStats.get(o.affiliate_id) ?? { orders: 0, revenue: 0 };
        s.orders += 1;
        s.revenue += Number(o.total || 0);
        affiliateStats.set(o.affiliate_id, s);
      }
      if (o.customer_id) {
        const s = customerStats.get(o.customer_id) ?? { orders: 0, revenue: 0 };
        s.orders += 1;
        s.revenue += Number(o.total || 0);
        customerStats.set(o.customer_id, s);
      }
    });

    const topPromos = Array.from(promoStats.entries())
      .map(([code, s]) => ({ code, ...s }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const topAffiliateIds = Array.from(affiliateStats.keys());
    const topCustomerIds = Array.from(customerStats.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([id]) => id);

    const profileIds = Array.from(new Set([...topAffiliateIds, ...topCustomerIds]));
    const { data: profiles } =
      profileIds.length > 0
        ? await supabaseAdmin.from("profiles").select("id, email, full_name").in("id", profileIds)
        : { data: [] as any[] };
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const topAffiliates = Array.from(affiliateStats.entries())
      .map(([id, s]) => ({ id, ...s, profile: profileMap.get(id) ?? null }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const topCustomers = topCustomerIds.map((id) => ({
      id,
      ...customerStats.get(id)!,
      profile: profileMap.get(id) ?? null,
    }));

    // Campaign effectiveness: cross-ref promo_code
    const { data: campaigns } = await supabaseAdmin
      .from("campaigns")
      .select("id, name, promo_code, status")
      .order("created_at", { ascending: false });
    const campaignPerf = (campaigns ?? []).map((c: any) => {
      const s = c.promo_code ? promoStats.get(c.promo_code) : undefined;
      return { ...c, uses: s?.uses ?? 0, revenue: s?.revenue ?? 0, discount: s?.discount ?? 0 };
    });

    return { topPromos, topAffiliates, topCustomers, campaignPerf };
  });

// ---------- Affiliate self-view ----------

export const getMyAffiliateStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, code, total, status, paid_at, created_at, customer_id")
      .or(`affiliate_id.eq.${userId},agent_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(200);

    const all = orders ?? [];
    const paid = all.filter((o) => o.status === "paid");
    const totalRevenue = paid.reduce((s, o) => s + Number(o.total || 0), 0);

    // Commission earned from transactions
    const { data: txns } = await supabaseAdmin
      .from("transactions")
      .select("amount, type, created_at")
      .eq("user_id", userId)
      .in("type", ["commission"])
      .limit(500);
    const totalCommission = (txns ?? []).reduce((s, t) => s + Number(t.amount || 0), 0);

    // Click tracking from affiliate_clicks
    const { count: clicksCount } = await supabaseAdmin
      .from("affiliate_clicks")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId);

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: clicks7d } = await supabaseAdmin
      .from("affiliate_clicks")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId)
      .gte("created_at", since);

    const { data: recentClicks } = await supabaseAdmin
      .from("affiliate_clicks")
      .select("id, landing_path, referer, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Referred signups
    const { count: referredSignups } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId);

    return {
      ordersCount: all.length,
      paidCount: paid.length,
      totalRevenue,
      totalCommission,
      clicksCount: clicksCount ?? 0,
      clicks7d: clicks7d ?? 0,
      referredSignups: referredSignups ?? 0,
      recentClicks: recentClicks ?? [],
      recentOrders: all.slice(0, 20),
    };
  });
