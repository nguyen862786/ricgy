import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const markPaidInput = z.object({ orderId: z.string().uuid() });

export const markOrderPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => markPaidInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // ensure caller is staff
    const { data: staffRows } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["owner", "admin"]);
    if (!staffRows || staffRows.length === 0) throw new Error("Bạn không có quyền duyệt đơn");

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();
    if (oErr || !order) throw new Error("Không tìm thấy đơn");
    if (order.status === "paid") return { ok: true, already: true };

    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("cashback_amount, affiliate_commission, agent_commission")
      .eq("order_id", order.id);

    const sum = (items ?? []).reduce(
      (acc, it) => {
        acc.cashback += Number(it.cashback_amount || 0);
        acc.aff += Number(it.affiliate_commission || 0);
        acc.agent += Number(it.agent_commission || 0);
        return acc;
      },
      { cashback: 0, aff: 0, agent: 0 },
    );

    // mark paid
    await supabaseAdmin
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", order.id);

    const orderCode = order.code;
    const orderId = order.id;
    async function credit(uid: string | null, amount: number, type: "cashback" | "commission") {
      if (!uid || amount <= 0) return;
      const { data: w } = await supabaseAdmin
        .from("wallets")
        .select("balance")
        .eq("user_id", uid)
        .single();
      const newBal = Number(w?.balance || 0) + amount;
      await supabaseAdmin
        .from("wallets")
        .update({ balance: newBal, updated_at: new Date().toISOString() })
        .eq("user_id", uid);
      await supabaseAdmin.from("transactions").insert({
        user_id: uid,
        amount,
        type,
        status: "completed",
        reference_id: orderId,
        note: `Đơn ${orderCode}`,
      });
    }

    await credit(order.customer_id, sum.cashback, "cashback");
    await credit(order.affiliate_id, sum.aff, "commission");
    await credit(order.agent_id, sum.agent, "commission");

    // Trừ tồn kho theo từng dòng
    const { data: lineItems } = await supabaseAdmin
      .from("order_items")
      .select("product_id, qty")
      .eq("order_id", order.id);
    for (const li of lineItems ?? []) {
      const { data: p } = await supabaseAdmin
        .from("products")
        .select("stock")
        .eq("id", li.product_id)
        .single();
      const newStock = Math.max(0, Number(p?.stock ?? 0) - Number(li.qty || 0));
      await supabaseAdmin.from("products").update({ stock: newStock }).eq("id", li.product_id);
    }

    // Tăng used_count cho promo
    if (order.promo_code) {
      const { data: promo } = await supabaseAdmin
        .from("promo_codes")
        .select("used_count")
        .eq("code", order.promo_code)
        .maybeSingle();
      if (promo) {
        await supabaseAdmin
          .from("promo_codes")
          .update({ used_count: Number(promo.used_count || 0) + 1 })
          .eq("code", order.promo_code);
      }
    }

    return { ok: true, credited: sum };
  });

const cancelInput = z.object({ orderId: z.string().uuid() });
export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => cancelInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staffRows } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["owner", "admin"]);
    if (!staffRows || staffRows.length === 0) throw new Error("Không có quyền");
    await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", data.orderId);
    return { ok: true };
  });
