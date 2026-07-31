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

const input = z.object({
  days: z.number().int().min(1).max(730).default(30),
});

export const getBusinessReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const days = data.days;
    const since = new Date(Date.now() - days * 86400_000);
    const sinceISO = since.toISOString();

    // Orders within window
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select(
        "id, total, discount, status, created_at, paid_at, promo_code, customer_id, affiliate_id",
      )
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true })
      .limit(5000);
    const ord = orders ?? [];

    // KPIs
    const paid = ord.filter((o) => o.status === "paid");
    const revenue = paid.reduce((s, o) => s + Number(o.total || 0), 0);
    const discountTotal = paid.reduce((s, o) => s + Number(o.discount || 0), 0);
    const aov = paid.length ? revenue / paid.length : 0;
    const ordersCount = ord.length;
    const paidCount = paid.length;
    const conversionRate = ordersCount ? (paidCount / ordersCount) * 100 : 0;

    // Daily timeseries (revenue + orders)
    const dayMap = new Map<string, { revenue: number; orders: number; paid: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 86400_000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { revenue: 0, orders: 0, paid: 0 });
    }
    ord.forEach((o) => {
      const key = (o.created_at || "").slice(0, 10);
      const slot = dayMap.get(key);
      if (!slot) return;
      slot.orders += 1;
      if (o.status === "paid") {
        slot.paid += 1;
        slot.revenue += Number(o.total || 0);
      }
    });
    const timeseries = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }));

    // Status breakdown
    const statusMap = new Map<string, number>();
    ord.forEach((o) => statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1));
    const statusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // Top products from order_items (only for paid orders)
    const paidIds = paid.map((o) => o.id);
    let topProducts: Array<{
      product_id: string;
      product_name: string;
      qty: number;
      revenue: number;
    }> = [];
    if (paidIds.length > 0) {
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("product_id, product_name, qty, line_total")
        .in("order_id", paidIds)
        .limit(5000);
      const pMap = new Map<
        string,
        { product_id: string; product_name: string; qty: number; revenue: number }
      >();
      (items ?? []).forEach((it: any) => {
        const k = it.product_id;
        const s = pMap.get(k) ?? {
          product_id: k,
          product_name: it.product_name,
          qty: 0,
          revenue: 0,
        };
        s.qty += Number(it.qty || 0);
        s.revenue += Number(it.line_total || 0);
        pMap.set(k, s);
      });
      topProducts = Array.from(pMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    }

    // Customer growth (new signups per day)
    const { data: newProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, created_at")
      .gte("created_at", sinceISO)
      .limit(5000);
    const signupMap = new Map<string, number>();
    for (const [k] of dayMap) signupMap.set(k, 0);
    (newProfiles ?? []).forEach((p) => {
      const key = (p.created_at || "").slice(0, 10);
      if (signupMap.has(key)) signupMap.set(key, (signupMap.get(key) ?? 0) + 1);
    });
    const signups = Array.from(signupMap.entries()).map(([date, count]) => ({ date, count }));
    const newCustomers = signups.reduce((s, x) => s + x.count, 0);

    return {
      kpi: { revenue, discountTotal, aov, ordersCount, paidCount, conversionRate, newCustomers },
      timeseries,
      statusBreakdown,
      topProducts,
      signups,
    };
  });

const reconInput = z.object({
  days: z.number().int().min(1).max(730).default(90),
  promotionId: z.string().uuid().nullable().optional(),
  storeId: z.string().uuid().nullable().optional(),
});

export const getQiClubReconciliation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => reconInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();

    let q = supabaseAdmin
      .from("qiclub_redemptions")
      .select(
        "id, code, promotion_id, promotion_name, order_id, store_id, status, voucher_amount, qiclub_amount, company_amount, store_amount, qiclub_ref, claimed_at, created_at",
      )
      .eq("status", "claimed")
      .gte("claimed_at", since)
      .order("claimed_at", { ascending: false })
      .limit(5000);
    if (data.promotionId) q = q.eq("promotion_id", data.promotionId);
    if (data.storeId) q = q.eq("store_id", data.storeId);
    const { data: rows } = await q;
    const list = rows ?? [];

    // resolve store + order names
    const { data: stores } = await supabaseAdmin.from("stores").select("id, name, code");
    const storeMap = new Map((stores ?? []).map((s: any) => [s.id, s]));
    const orderIds = Array.from(new Set(list.map((r: any) => r.order_id).filter(Boolean)));
    let orderMap = new Map<string, any>();
    if (orderIds.length) {
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("id, code")
        .in("id", orderIds);
      orderMap = new Map((orders ?? []).map((o: any) => [o.id, o]));
    }

    const detail = list.map((r: any) => ({
      id: r.id,
      code: r.code,
      qiclub_ref: r.qiclub_ref,
      campaign: r.promotion_name ?? "—",
      promotion_id: r.promotion_id,
      store_id: r.store_id,
      store: r.store_id ? (storeMap.get(r.store_id)?.name ?? "—") : "—",
      order_code: r.order_id ? (orderMap.get(r.order_id)?.code ?? "—") : "—",
      voucher_amount: Number(r.voucher_amount || 0),
      qiclub_amount: Number(r.qiclub_amount || 0),
      company_amount: Number(r.company_amount || 0),
      store_amount: Number(r.store_amount || 0),
      claimed_at: r.claimed_at,
    }));

    const totals = detail.reduce(
      (acc, r) => {
        acc.count += 1;
        acc.voucher += r.voucher_amount;
        acc.qiclub += r.qiclub_amount;
        acc.company += r.company_amount;
        acc.store += r.store_amount;
        return acc;
      },
      { count: 0, voucher: 0, qiclub: 0, company: 0, store: 0 },
    );

    // group by campaign
    const byCampaignMap = new Map<string, any>();
    for (const r of detail) {
      const key = r.promotion_id ?? r.campaign;
      const s = byCampaignMap.get(key) ?? {
        campaign: r.campaign,
        count: 0,
        voucher: 0,
        qiclub: 0,
        company: 0,
        store: 0,
      };
      s.count += 1;
      s.voucher += r.voucher_amount;
      s.qiclub += r.qiclub_amount;
      s.company += r.company_amount;
      s.store += r.store_amount;
      byCampaignMap.set(key, s);
    }
    const byStoreMap = new Map<string, any>();
    for (const r of detail) {
      const key = r.store_id ?? "—";
      const s = byStoreMap.get(key) ?? {
        store: r.store,
        count: 0,
        voucher: 0,
        qiclub: 0,
        company: 0,
        store_amount: 0,
      };
      s.count += 1;
      s.voucher += r.voucher_amount;
      s.qiclub += r.qiclub_amount;
      s.company += r.company_amount;
      s.store_amount += r.store_amount;
      byStoreMap.set(key, s);
    }

    // filter option lists
    const { data: campaigns } = await supabaseAdmin
      .from("promotions")
      .select("id, name")
      .eq("is_qiclub_synced", true)
      .order("name");

    return {
      detail,
      totals,
      byCampaign: Array.from(byCampaignMap.values()).sort((a, b) => b.voucher - a.voucher),
      byStore: Array.from(byStoreMap.values()).sort((a, b) => b.voucher - a.voucher),
      campaigns: campaigns ?? [],
      stores: (stores ?? []).map((s: any) => ({ id: s.id, name: s.name })),
    };
  });
