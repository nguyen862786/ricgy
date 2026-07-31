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

function genInvoiceNo(provider: string) {
  const seq = Math.floor(Math.random() * 9_000_000) + 1_000_000;
  const prefix = provider === "viettel" ? "VT" : "MISA";
  return `${prefix}-${new Date().getFullYear()}-${seq}`;
}

const issueInput = z.object({
  orderId: z.string().uuid(),
  provider: z.enum(["misa", "viettel"]).default("misa"),
});

// Xuất hoá đơn điện tử real-time cho 1 đơn (giả lập kết nối Misa/Viettel)
export const issueEInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => issueInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();
    if (error || !order) throw new Error("Không tìm thấy đơn");

    const { data: existing } = await supabaseAdmin
      .from("einvoices")
      .select("id, status, invoice_no")
      .eq("order_id", data.orderId)
      .eq("status", "issued")
      .maybeSingle();
    if (existing) return { ok: true, already: true, invoice_no: existing.invoice_no };

    const invoiceNo = genInvoiceNo(data.provider);
    const now = new Date().toISOString();
    const { data: row, error: insErr } = await supabaseAdmin
      .from("einvoices")
      .insert({
        order_id: order.id,
        store_id: order.store_id,
        provider: data.provider,
        status: "issued",
        invoice_no: invoiceNo,
        is_batch: false,
        amount: Number(order.total || 0),
        issued_at: now,
        created_by: context.userId,
        payload: {
          order_code: order.code,
          subtotal: order.subtotal,
          discount: order.discount,
          total: order.total,
          simulated: true,
        },
      })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);
    return { ok: true, invoice_no: invoiceNo, id: row.id };
  });

const batchInput = z.object({
  storeId: z.string().uuid().nullable().optional(),
});

// Gom xuất hoá đơn cuối ngày cho các đơn khách lẻ đã thanh toán chưa xuất HĐ
export const batchIssueEInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => batchInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let q = supabaseAdmin
      .from("orders")
      .select("id, code, total, store_id, customer_id")
      .eq("status", "paid")
      .gte("paid_at", startOfDay.toISOString());
    if (data.storeId) q = q.eq("store_id", data.storeId);
    const { data: orders } = await q;

    // chỉ gom đơn khách lẻ (không có customer_id) và chưa xuất HĐ
    const { data: issued } = await supabaseAdmin
      .from("einvoices")
      .select("order_id")
      .eq("status", "issued");
    const issuedSet = new Set((issued ?? []).map((r) => r.order_id));

    const pending = (orders ?? []).filter((o) => !o.customer_id && !issuedSet.has(o.id));
    if (pending.length === 0) return { ok: true, count: 0 };

    const total = pending.reduce((s, o) => s + Number(o.total || 0), 0);
    const invoiceNo = genInvoiceNo("misa");
    const now = new Date().toISOString();
    await supabaseAdmin.from("einvoices").insert({
      order_id: null,
      store_id: data.storeId ?? null,
      provider: "misa",
      status: "issued",
      invoice_no: invoiceNo,
      is_batch: true,
      amount: total,
      issued_at: now,
      created_by: context.userId,
      payload: {
        order_codes: pending.map((o) => o.code),
        order_count: pending.length,
        simulated: true,
      },
    });
    return { ok: true, count: pending.length, total, invoice_no: invoiceNo };
  });
