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

const openInput = z.object({
  storeId: z.string().uuid().nullable().optional(),
  openingCash: z.number().min(0).max(1_000_000_000).default(0),
});

// Mở ca làm việc
export const openShift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => openInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);

    // không cho mở 2 ca cùng lúc trên cùng store
    let openQ = supabaseAdmin
      .from("shifts")
      .select("id")
      .eq("status", "open")
      .eq("staff_id", context.userId);
    if (data.storeId) openQ = openQ.eq("store_id", data.storeId);
    const { data: opened } = await openQ;
    if (opened && opened.length > 0) throw new Error("Bạn đang có ca chưa đóng tại điểm bán này");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();

    const { data: row, error } = await supabaseAdmin
      .from("shifts")
      .insert({
        store_id: data.storeId ?? null,
        staff_id: context.userId,
        staff_email: profile?.email ?? null,
        opening_cash: data.openingCash,
        status: "open",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

const closeInput = z.object({
  shiftId: z.string().uuid(),
  countedCash: z.number().min(0).max(1_000_000_000),
  reason: z.string().max(500).optional(),
});

// Đóng ca: tính doanh thu hệ thống trong ca + chênh lệch tiền
export const closeShift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => closeInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);

    const { data: shift, error } = await supabaseAdmin
      .from("shifts")
      .select("*")
      .eq("id", data.shiftId)
      .single();
    if (error || !shift) throw new Error("Không tìm thấy ca");
    if (shift.status === "closed") throw new Error("Ca đã đóng");

    const now = new Date().toISOString();
    let q = supabaseAdmin
      .from("orders")
      .select("total")
      .eq("status", "paid")
      .gte("paid_at", shift.opened_at)
      .lte("paid_at", now);
    if (shift.store_id) q = q.eq("store_id", shift.store_id);
    const { data: orders } = await q;
    const systemTotal = (orders ?? []).reduce((s, o) => s + Number(o.total || 0), 0);

    const expected = Number(shift.opening_cash || 0) + systemTotal;
    const diff = Number(data.countedCash) - expected;

    if (Math.abs(diff) > 0 && !data.reason) {
      throw new Error("Có chênh lệch tiền, vui lòng nhập lý do");
    }

    await supabaseAdmin
      .from("shifts")
      .update({
        system_total: systemTotal,
        counted_cash: data.countedCash,
        diff,
        reason: data.reason ?? null,
        status: "closed",
        closed_at: now,
      })
      .eq("id", shift.id);

    return { ok: true, systemTotal, expected, diff };
  });
