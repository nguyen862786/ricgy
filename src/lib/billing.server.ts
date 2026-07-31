import crypto from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { planMonths, type PlanKey } from "@/lib/billing";

const GRACE_DAYS = 3;

type BStatus = "active" | "grace_period" | "suspended" | "trial";

function secret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-billing-secret";
}

export function signToken(token: string): string {
  return crypto.createHmac("sha256", secret()).update(token).digest("hex");
}

export function verifyToken(token: string, sig: string): boolean {
  const expected = signToken(token);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Kích hoạt / gia hạn store: cộng dồn paid_until, bật active
export async function activateStore(storeId: string, plan: PlanKey, months: number) {
  const m = planMonths(plan, months);
  const { data: store } = await supabaseAdmin
    .from("stores")
    .select("paid_until")
    .eq("id", storeId)
    .single();
  const base =
    store?.paid_until && new Date(store.paid_until) > new Date()
      ? new Date(store.paid_until)
      : new Date();
  base.setMonth(base.getMonth() + m);

  await supabaseAdmin
    .from("stores")
    .update({
      billing_status: "active",
      plan,
      hardware_combo: plan === "combo",
      paid_until: base.toISOString(),
      grace_ends_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId);

  return { paid_until: base.toISOString(), months: m };
}

// Tính lại vòng đời tất cả store theo ngày: TRIAL → ACTIVE → GRACE → SUSPENDED
export async function refreshAllBilling() {
  const { data: stores } = await supabaseAdmin
    .from("stores")
    .select("id, billing_status, trial_ends_at, grace_ends_at, paid_until");
  const now = Date.now();

  for (const s of stores ?? []) {
    let status: BStatus = s.billing_status as BStatus;
    let graceEnds = s.grace_ends_at as string | null;

    const paidUntil = s.paid_until ? new Date(s.paid_until).getTime() : null;
    const trialEnds = s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : null;

    if (paidUntil && now < paidUntil) {
      status = "active";
      graceEnds = null;
    } else {
      const endRef = paidUntil ?? trialEnds;
      if (endRef) {
        if (now < endRef) {
          status = paidUntil ? "active" : "trial";
        } else {
          const graceLimit = endRef + GRACE_DAYS * 86_400_000;
          if (now < graceLimit) {
            status = "grace_period";
            graceEnds = new Date(graceLimit).toISOString();
          } else {
            status = "suspended";
          }
        }
      }
    }

    if (status !== s.billing_status || graceEnds !== s.grace_ends_at) {
      await supabaseAdmin
        .from("stores")
        .update({
          billing_status: status,
          grace_ends_at: graceEnds,
          updated_at: new Date().toISOString(),
        })
        .eq("id", s.id);
    }
  }
}
