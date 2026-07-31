import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { matchesPrefix, splitSubsidy, DEFAULT_QICLUB_CONFIG } from "@/lib/qiclub";
import type { QiClubConfig } from "@/lib/qiclub";

// ── Local type aliases derived from generated Database schema ───────────────

type SupabaseCtx = { supabase: SupabaseClient<Database>; userId: string };

type PromoRow = Pick<
  Database["public"]["Tables"]["promotions"]["Row"],
  | "id"
  | "name"
  | "discount_percent"
  | "max_discount_amount"
  | "qiclub_prefix"
  | "qiclub_subsidy_ratio"
  | "company_subsidy_ratio"
  | "store_subsidy_ratio"
  | "is_qiclub_synced"
  | "is_active"
>;

type RedemptionLookup = Pick<
  Database["public"]["Tables"]["qiclub_redemptions"]["Row"],
  "id" | "status" | "qiclub_ref" | "verified_at" | "store_id"
>;

// webhook_status/webhook_error were added in migration 20260614200000 and are
// not yet reflected in the auto-generated types.
// Base types used when calling Supabase (RejectExcessProperties accepts exact type).
type BaseRedemptionInsert = Database["public"]["Tables"]["qiclub_redemptions"]["Insert"];
type BaseRedemptionUpdate = Database["public"]["Tables"]["qiclub_redemptions"]["Update"];
// Extended types used locally to type-check object construction.
type RedemptionUpdate = BaseRedemptionUpdate & {
  webhook_status?: string | null;
  webhook_error?: string | null;
};
type RedemptionInsert = BaseRedemptionInsert & {
  webhook_status?: string | null;
  webhook_error?: string | null;
};

type QiClubMemberRow = Pick<
  Database["public"]["Tables"]["qiclub_members"]["Row"],
  "id" | "phone" | "qr_code" | "full_name" | "total_points" | "is_active"
>;

type MembershipLookup = Pick<
  Database["public"]["Tables"]["tenant_memberships"]["Row"],
  "internal_tier" | "points" | "visit_count" | "total_spent" | "last_purchase_at"
>;

// ── Internal helpers ────────────────────────────────────────────────────────

async function assertStaff(ctx: SupabaseCtx) {
  const { data } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .in("role", ["super_admin", "owner", "admin", "store_manager", "cashier"]);
  if (!data || data.length === 0) throw new Error("Không có quyền thực hiện thao tác này.");
}

/**
 * Tìm chiến dịch QiClub có tiền tố dài nhất khớp với mã được nhập.
 * Chiến dịch phải đang active và được đồng bộ với QiClub.
 */
async function resolveCampaign(
  ctx: Pick<SupabaseCtx, "supabase">,
  code: string,
): Promise<PromoRow | null> {
  const { data: promos } = await ctx.supabase
    .from("promotions")
    .select(
      "id, name, discount_percent, max_discount_amount, qiclub_prefix, qiclub_subsidy_ratio, company_subsidy_ratio, store_subsidy_ratio, is_qiclub_synced, is_active",
    )
    .eq("is_qiclub_synced", true)
    .eq("is_active", true);

  const matched = (promos ?? [])
    .filter((p) => matchesPrefix(code, p.qiclub_prefix))
    .sort((a, b) => (b.qiclub_prefix?.length ?? 0) - (a.qiclub_prefix?.length ?? 0));

  return matched[0] ?? null;
}

function computeDiscount(promo: PromoRow, subtotal: number): number {
  let d = (subtotal * Number(promo.discount_percent)) / 100;
  if (promo.max_discount_amount != null) d = Math.min(d, Number(promo.max_discount_amount));
  return Math.round(Math.min(d, subtotal));
}

async function fetchQiClubConfig(supabase: SupabaseClient<Database>): Promise<QiClubConfig> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "qiclub_config")
    .maybeSingle();
  if (!data?.value) return DEFAULT_QICLUB_CONFIG;
  return { ...DEFAULT_QICLUB_CONFIG, ...(data.value as Partial<QiClubConfig>) };
}

/**
 * Tạo chữ ký HMAC-SHA256 dạng hex.
 * Payload ký: "{timestamp_ms}.{body_string}"
 * Header gửi đi: "sha256={hex_signature}"
 *
 * Tương thích cả Cloudflare Workers (Web Crypto global) lẫn Node.js ≥ 18.
 */
async function signHmacSha256(secret: string, timestamp: number, body: string): Promise<string> {
  const message = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return (
    "sha256=" +
    Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Bắn webhook sang hệ thống đối tác QiClub.
 * Trả về { ok, httpStatus?, error? }.
 * Hàm không throw — mọi lỗi đều được ghi log và trả về trong kết quả.
 */
async function fireQiClubWebhook(
  config: QiClubConfig,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; httpStatus?: number; error?: string }> {
  if (!config.webhook_url) {
    return { ok: false, error: "webhook_url chưa được cấu hình." };
  }

  const body = JSON.stringify(payload);
  const timestamp = Date.now();
  const signature = config.secret_key
    ? await signHmacSha256(config.secret_key, timestamp, body)
    : "";

  try {
    const res = await fetch(config.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-QiClub-Signature": signature,
        "X-QiClub-Timestamp": String(timestamp),
      },
      body,
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`QiClub webhook HTTP ${res.status}:`, text);
      return { ok: false, httpStatus: res.status, error: text.slice(0, 500) };
    }

    return { ok: true, httpStatus: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("QiClub webhook lỗi kết nối:", msg);
    return { ok: false, error: msg };
  }
}

// ── verifyQiClubCode ────────────────────────────────────────────────────────

const verifyInput = z.object({
  code: z.string().trim().min(2).max(64),
  subtotal: z.number().min(0).max(1_000_000_000),
  storeId: z.string().uuid().nullable().optional(),
});

/**
 * Xác thực mã voucher QiClub theo thời gian thực tại máy POS.
 *
 * Luồng:
 * 1. Chuẩn hóa mã → uppercase.
 * 2. Nhận diện tiền tố: tìm chiến dịch QiClub khớp dài nhất (longest prefix wins).
 * 3. Kiểm tra single-use: mã đã claimed → từ chối.
 * 4. Tính chiết khấu và bóc tách nghĩa vụ tài chính (QiClub / Tổng công ty / Cửa hàng).
 * 5. Upsert bản ghi "verified" (idempotent — xác thực lại cùng mã không tạo bản ghi mới).
 */
export const verifyQiClubCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => verifyInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);

    const code = data.code.trim().toUpperCase();

    // 1. Nhận diện tiền tố
    const promo = await resolveCampaign(context, code);
    if (!promo) {
      return {
        valid: false as const,
        reason: "Mã không thuộc hệ sinh thái QiClub hoặc chiến dịch tương ứng đã bị tắt.",
      };
    }

    // 2. Kiểm tra single-use — tra qua unique index lower(code)
    const { data: existing } = await context.supabase
      .from("qiclub_redemptions")
      .select("id, status, qiclub_ref, verified_at")
      .ilike("code", code)
      .maybeSingle();

    const existingRow = existing as RedemptionLookup | null;

    if (existingRow?.status === "claimed") {
      return { valid: false as const, reason: "Mã đã được sử dụng (single-use)." };
    }

    // 3. Tính chiết khấu
    const discount = computeDiscount(promo, data.subtotal);

    // 4. Bóc tách nghĩa vụ tài chính theo tỷ lệ đã cấu hình trên chiến dịch
    const split = splitSubsidy(
      discount,
      Number(promo.qiclub_subsidy_ratio),
      Number(promo.company_subsidy_ratio),
      Number(promo.store_subsidy_ratio),
    );

    // 5. Tạo mã tham chiếu QiClub duy nhất nếu chưa có
    const qiclub_ref =
      existingRow?.qiclub_ref ??
      `QV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const now = new Date().toISOString();
    const row = {
      code,
      promotion_id: promo.id,
      promotion_name: promo.name,
      store_id: data.storeId ?? null,
      status: "verified",
      voucher_amount: discount,
      qiclub_amount: split.qiclub,
      company_amount: split.company,
      store_amount: split.store,
      qiclub_ref,
      verified_at: existingRow?.verified_at ?? now,
      created_by: context.userId,
    };

    if (existingRow) {
      await context.supabase.from("qiclub_redemptions").update(row).eq("id", existingRow.id);
    } else {
      await context.supabase.from("qiclub_redemptions").insert(row);
    }

    return {
      valid: true as const,
      qiclub_ref,
      promotion: {
        id: promo.id,
        name: promo.name,
        discount_percent: Number(promo.discount_percent),
        qiclub_subsidy_ratio: Number(promo.qiclub_subsidy_ratio),
        company_subsidy_ratio: Number(promo.company_subsidy_ratio),
        store_subsidy_ratio: Number(promo.store_subsidy_ratio),
      },
      discount,
      split,
    };
  });

// ── claimQiClubCode ─────────────────────────────────────────────────────────

const claimInput = z.object({
  code: z.string().trim().min(2).max(64),
  orderId: z.string().uuid(),
  storeId: z.string().uuid().nullable().optional(),
  subtotal: z.number().min(0).max(1_000_000_000),
});

/**
 * Khóa mã voucher QiClub khi POS hoàn thành đơn hàng.
 *
 * Luồng:
 * 1. Xác thực lại mã (re-verify để chống race condition nếu POS bị trùng lệnh).
 * 2. Đánh dấu "claimed" trong DB ngay lập tức — đây là nguồn sự thật duy nhất
 *    của hệ thống, ngăn double-use kể cả khi webhook thất bại.
 * 3. Lấy cấu hình QiClub từ app_settings (webhook_url + secret_key).
 * 4. Ký payload bằng HMAC-SHA256 và bắn POST sang endpoint đối tác.
 * 5. Lưu trạng thái webhook (ok/fail) vào bản ghi để retry sau nếu cần.
 */
export const claimQiClubCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => claimInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);

    const code = data.code.trim().toUpperCase();
    const now = new Date().toISOString();

    // 1. Xác thực lại mã
    const promo = await resolveCampaign(context, code);
    if (!promo) {
      throw new Error("Mã không thuộc hệ sinh thái QiClub hoặc chiến dịch đã bị tắt.");
    }

    const { data: existingRaw } = await context.supabase
      .from("qiclub_redemptions")
      .select("id, status, qiclub_ref, verified_at, store_id")
      .ilike("code", code)
      .maybeSingle();

    const existing = existingRaw as RedemptionLookup | null;

    if (existing?.status === "claimed") {
      throw new Error("Mã đã được sử dụng (single-use). Không thể claim lại.");
    }

    const discount = computeDiscount(promo, data.subtotal);
    const split = splitSubsidy(
      discount,
      Number(promo.qiclub_subsidy_ratio),
      Number(promo.company_subsidy_ratio),
      Number(promo.store_subsidy_ratio),
    );

    const qiclub_ref =
      existing?.qiclub_ref ??
      `QV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const storeId = data.storeId ?? existing?.store_id ?? null;

    // 2. Đánh dấu "claimed" trong DB trước tiên
    const claimedRow: RedemptionInsert = {
      code,
      promotion_id: promo.id,
      promotion_name: promo.name,
      order_id: data.orderId,
      store_id: storeId,
      status: "claimed",
      voucher_amount: discount,
      qiclub_amount: split.qiclub,
      company_amount: split.company,
      store_amount: split.store,
      qiclub_ref,
      verified_at: existing?.verified_at ?? now,
      claimed_at: now,
      created_by: context.userId,
      webhook_status: null,
      webhook_error: null,
    };

    // claimedRow has webhook_status/webhook_error not yet in generated types.
    // Cast through unknown to the base type to satisfy RejectExcessProperties.
    let redemptionId: string;
    if (existing) {
      const { data: updated } = await context.supabase
        .from("qiclub_redemptions")
        .update(claimedRow as unknown as BaseRedemptionUpdate)
        .eq("id", existing.id)
        .select("id")
        .single();
      redemptionId = (updated as { id: string } | null)?.id ?? existing.id;
    } else {
      const { data: inserted } = await context.supabase
        .from("qiclub_redemptions")
        .insert(claimedRow as unknown as BaseRedemptionInsert)
        .select("id")
        .single();
      redemptionId = (inserted as { id: string } | null)?.id ?? "";
    }

    // 3. Lấy cấu hình webhook từ app_settings
    const config = await fetchQiClubConfig(context.supabase);

    // 4. Bắn webhook sang đối tác QiClub
    const webhookPayload: Record<string, unknown> = {
      event: "code.claimed",
      qiclub_ref,
      code,
      order_id: data.orderId,
      store_id: storeId,
      voucher_amount: discount,
      qiclub_amount: split.qiclub,
      company_amount: split.company,
      store_amount: split.store,
      claimed_at: now,
    };

    const webhookResult = await fireQiClubWebhook(config, webhookPayload);

    // 5. Ghi kết quả webhook vào bản ghi
    if (redemptionId) {
      const webhookUpdate: RedemptionUpdate = {
        webhook_status: webhookResult.ok ? "delivered" : "failed",
        webhook_error: webhookResult.error ?? null,
      };
      await context.supabase
        .from("qiclub_redemptions")
        .update(webhookUpdate as unknown as BaseRedemptionUpdate)
        .eq("id", redemptionId);
    }

    return {
      ok: true as const,
      qiclub_ref,
      discount,
      split,
      webhook: webhookResult,
    };
  });

// ── lookupQiClubMember ──────────────────────────────────────────────────────

const lookupInput = z.object({
  query: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[A-Za-z0-9+\-_]+$/),
});

/**
 * Tra cứu định danh thành viên QiClub toàn hệ thống theo SĐT hoặc mã QR.
 *
 * Nhân viên thuộc BẤT KỲ doanh nghiệp nào đều tra cứu được định danh chung
 * (SĐT, QR tổng, điểm tổng). Tuy nhiên chỉ thấy hạng & lịch sử nội bộ của
 * CHÍNH doanh nghiệp mình — dữ liệu của tenant khác bị RLS chặn hoàn toàn.
 */
export const lookupQiClubMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => lookupInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);

    const q = data.query.trim();

    let member: QiClubMemberRow | null = null;

    const { data: byPhone } = await context.supabase
      .from("qiclub_members")
      .select("id, phone, qr_code, full_name, total_points, is_active")
      .eq("phone", q)
      .maybeSingle();
    member = byPhone as QiClubMemberRow | null;

    if (!member) {
      const { data: byQr } = await context.supabase
        .from("qiclub_members")
        .select("id, phone, qr_code, full_name, total_points, is_active")
        .eq("qr_code", q)
        .maybeSingle();
      member = byQr as QiClubMemberRow | null;
    }

    if (!member) return { found: false as const };

    const { data: profRow } = await context.supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", context.userId)
      .maybeSingle();

    const tenantId =
      (profRow as Pick<Database["public"]["Tables"]["profiles"]["Row"], "tenant_id"> | null)
        ?.tenant_id ?? null;

    let membership: MembershipLookup | null = null;
    if (tenantId) {
      const { data: mRow } = await context.supabase
        .from("tenant_memberships")
        .select("internal_tier, points, visit_count, total_spent, last_purchase_at")
        .eq("member_id", member.id)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      membership = mRow as MembershipLookup | null;
    }

    return {
      found: true as const,
      member: {
        id: member.id,
        phone: member.phone,
        qr_code: member.qr_code,
        full_name: member.full_name,
        total_points: member.total_points,
        is_active: member.is_active,
      },
      membership,
      hasTenant: !!tenantId,
    };
  });
