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

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);

    // Lấy danh sách user có role customer
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "customer");
    const customerIds = (roles ?? []).map((r) => r.user_id);
    if (customerIds.length === 0) return [];

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, email, full_name, phone, tier, total_spent, created_at, tags, marketing_notes, last_order_at",
      )
      .in("id", customerIds)
      .order("total_spent", { ascending: false });

    // Đếm đơn paid cho mỗi khách
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("customer_id, status")
      .in("customer_id", customerIds);
    const orderCount = new Map<string, { total: number; paid: number }>();
    (orders ?? []).forEach((o) => {
      if (!o.customer_id) return;
      const cur = orderCount.get(o.customer_id) ?? { total: 0, paid: 0 };
      cur.total += 1;
      if (o.status === "paid") cur.paid += 1;
      orderCount.set(o.customer_id, cur);
    });

    return (profiles ?? []).map((p) => ({
      ...p,
      order_total: orderCount.get(p.id)?.total ?? 0,
      order_paid: orderCount.get(p.id)?.paid ?? 0,
    }));
  });

export const listTiers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data } = await supabaseAdmin
      .from("customer_tiers")
      .select("*")
      .order("sort_order", { ascending: true });
    return data ?? [];
  });

const tierInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(50),
  min_spent: z.number().min(0),
  discount_percent: z.number().min(0).max(100),
  color: z.string().min(1).max(20),
  sort_order: z.number().int().min(0).max(999),
});

export const upsertTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => tierInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    if (data.id) {
      const { error } = await supabaseAdmin.from("customer_tiers").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("customer_tiers").insert(data);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { error } = await supabaseAdmin.from("customer_tiers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const updateCustomerInput = z.object({
  customerId: z.string().uuid(),
  tags: z.array(z.string().min(1).max(30)).max(20).optional(),
  marketing_notes: z.string().max(2000).nullable().optional(),
});

export const updateCustomerMarketing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updateCustomerInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const patch: { tags?: string[]; marketing_notes?: string | null } = {};
    if (data.tags !== undefined) patch.tags = data.tags;
    if (data.marketing_notes !== undefined) patch.marketing_notes = data.marketing_notes;
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.customerId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCustomer360 = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ customerId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const id = data.customerId;

    const [profileRes, walletRes, ordersRes, txnsRes, refsRes, tiersRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabaseAdmin.from("wallets").select("*").eq("user_id", id).maybeSingle(),
      supabaseAdmin
        .from("orders")
        .select("*")
        .eq("customer_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, total_spent, created_at")
        .eq("referrer_id", id),
      supabaseAdmin.from("customer_tiers").select("*").order("sort_order", { ascending: true }),
    ]);

    if (!profileRes.data) throw new Error("Không tìm thấy khách hàng");

    const orders = ordersRes.data ?? [];
    const orderIds = orders.map((o) => o.id);
    let items: any[] = [];
    if (orderIds.length > 0) {
      const { data: itemsData } = await supabaseAdmin
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);
      items = itemsData ?? [];
    }
    const itemsByOrder = new Map<string, any[]>();
    items.forEach((it) => {
      const arr = itemsByOrder.get(it.order_id) ?? [];
      arr.push(it);
      itemsByOrder.set(it.order_id, arr);
    });
    const ordersWithItems = orders.map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] }));

    const paidOrders = orders.filter((o) => o.status === "paid");
    const totalPaid = paidOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const avgOrder = paidOrders.length > 0 ? totalPaid / paidOrders.length : 0;

    return {
      profile: profileRes.data,
      wallet: walletRes.data,
      orders: ordersWithItems,
      transactions: txnsRes.data ?? [],
      referrals: refsRes.data ?? [],
      tiers: tiersRes.data ?? [],
      stats: {
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        totalPaid,
        avgOrder,
      },
    };
  });
