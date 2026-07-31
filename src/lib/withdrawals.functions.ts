import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const input = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  note: z.string().max(500).optional(),
});

export const processWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staffRows } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["owner", "admin"]);
    if (!staffRows || staffRows.length === 0) throw new Error("Không có quyền");

    const { data: req, error } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("*")
      .eq("id", data.requestId)
      .single();
    if (error || !req) throw new Error("Không tìm thấy yêu cầu");
    if (req.status !== "pending") throw new Error("Yêu cầu đã xử lý");

    if (data.action === "approve") {
      const { data: w } = await supabaseAdmin
        .from("wallets")
        .select("balance")
        .eq("user_id", req.user_id)
        .single();
      const bal = Number(w?.balance || 0);
      if (bal < Number(req.amount)) throw new Error("Số dư không đủ");
      await supabaseAdmin
        .from("wallets")
        .update({ balance: bal - Number(req.amount), updated_at: new Date().toISOString() })
        .eq("user_id", req.user_id);
      await supabaseAdmin.from("transactions").insert({
        user_id: req.user_id,
        amount: -Number(req.amount),
        type: "withdraw",
        status: "completed",
        reference_id: req.id,
        note: data.note ?? "Duyệt rút tiền",
      });
      await supabaseAdmin
        .from("withdrawal_requests")
        .update({
          status: "approved",
          processed_by: userId,
          processed_at: new Date().toISOString(),
          note: data.note ?? null,
        })
        .eq("id", req.id);
    } else {
      await supabaseAdmin
        .from("withdrawal_requests")
        .update({
          status: "rejected",
          processed_by: userId,
          processed_at: new Date().toISOString(),
          note: data.note ?? null,
        })
        .eq("id", req.id);
    }
    return { ok: true };
  });

const createInput = z.object({
  amount: z.number().positive().min(10000),
  bank_info: z.object({
    bank_name: z.string().min(1).max(100),
    account_number: z.string().min(1).max(50),
    account_holder: z.string().min(1).max(100),
  }),
});

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: w } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();
    if (Number(w?.balance || 0) < data.amount) throw new Error("Số dư không đủ");
    const { error } = await supabaseAdmin.from("withdrawal_requests").insert({
      user_id: userId,
      amount: data.amount,
      bank_info: data.bank_info,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
