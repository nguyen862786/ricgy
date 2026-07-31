import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { planAmount, planMonths } from "@/lib/billing";
import { signToken, activateStore, refreshAllBilling } from "@/lib/billing.server";

async function assertOwner(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "owner");
  if (!data || data.length === 0) throw new Error("Chỉ chủ hệ thống (owner) mới truy cập");
}

const planEnum = z.enum(["starter", "pro", "combo"]);

// Tính lại vòng đời + trả về danh sách store (owner)
export const getStoresBilling = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.userId);
    await refreshAllBilling();
    const { data } = await supabaseAdmin
      .from("stores")
      .select(
        "id, name, code, billing_status, trial_ends_at, grace_ends_at, plan, hardware_combo, paid_until",
      )
      .order("created_at", { ascending: true });
    return { stores: data ?? [] };
  });

const payInput = z.object({
  storeId: z.string().uuid(),
  plan: planEnum,
  months: z.number().int().min(1).max(36).default(1),
});

// Tạo thông tin thanh toán + token ký số cho QR kích hoạt
export const getBillingPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => payInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId);
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("code")
      .eq("id", data.storeId)
      .single();
    const months = planMonths(data.plan, data.months);
    const amount = planAmount(data.plan, data.months);
    const token = `${data.storeId}.${data.plan}.${months}`;
    const sig = signToken(token);
    return {
      amount,
      months,
      content: `KICHHOAT ${store?.code ?? ""} ${months}M`.trim(),
      token,
      sig,
    };
  });

const activateInput = z.object({
  storeId: z.string().uuid(),
  plan: planEnum,
  months: z.number().int().min(1).max(36).default(1),
});

// Owner kích hoạt thủ công (không cần quét QR)
export const activateStoreManual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => activateInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId);
    const res = await activateStore(data.storeId, data.plan, data.months);
    return { ok: true, ...res };
  });

const suspendInput = z.object({ storeId: z.string().uuid() });
export const suspendStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => suspendInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId);
    await supabaseAdmin
      .from("stores")
      .update({
        billing_status: "suspended",
        grace_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.storeId);
    return { ok: true };
  });
