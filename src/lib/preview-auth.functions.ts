import { createServerFn } from "@tanstack/react-start";
import { PREVIEW_ENABLED } from "@/lib/preview";

// Fixed demo credentials used ONLY in preview mode (VITE_PREVIEW_BYPASS=true).
// On a production build PREVIEW_ENABLED is compiled to false, so this server
// function refuses to run and the credentials are never usable.
export const PREVIEW_EMAIL = "preview@demo.com";
const PREVIEW_PASSWORD = "Preview-Demo-2026!";

/**
 * Idempotently provisions a real "preview admin" account with the `owner` role
 * and returns its credentials so the client can sign in with a real session.
 * Guarded by the PREVIEW_ENABLED build-time constant.
 */
export const ensurePreviewAdmin = createServerFn({ method: "POST" }).handler(async () => {
  if (!PREVIEW_ENABLED) {
    throw new Error("Chế độ xem trước đã bị tắt.");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let userId: string | null = null;

  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users?.find((u) => u.email === PREVIEW_EMAIL);

  if (existing) {
    userId = existing.id;
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: PREVIEW_PASSWORD,
      email_confirm: true,
    });
  } else {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: PREVIEW_EMAIL,
      password: PREVIEW_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Preview Admin" },
    });
    if (error || !created?.user)
      throw new Error(error?.message ?? "Không tạo được tài khoản xem trước");
    userId = created.user.id;
  }

  // Grant full admin (owner) access regardless of signup order.
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "owner" }, { onConflict: "user_id,role" });

  // Drop the auto-assigned 'customer' role so the demo account is purely admin.
  await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "customer");

  return { email: PREVIEW_EMAIL, password: PREVIEW_PASSWORD };
});
