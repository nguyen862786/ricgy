import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ApprovalSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

// Các role được phép phê duyệt thao tác nhạy cảm (Hủy đơn / Hoàn tiền / Đổi trả).
const APPROVER_ROLES = ["super_admin", "owner", "admin", "store_manager"];

/**
 * Xác thực mật khẩu của một tài khoản Quản lý cửa hàng / Chủ doanh nghiệp để
 * phê duyệt thao tác nhạy cảm do nhân viên thực hiện.
 *
 * Dùng một client tạm thời (không phải singleton trình duyệt) nên KHÔNG làm thay
 * đổi phiên đăng nhập hiện tại của nhân viên.
 */
export const verifyManagerApproval = createServerFn({ method: "POST" })
  .inputValidator((d) => ApprovalSchema.parse(d))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const { createClient } = await import("@supabase/supabase-js");

    const tmp = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: signin, error } = await tmp.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error || !signin.user) {
      return { approved: false as const, reason: "Sai email hoặc mật khẩu." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRows } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", signin.user.id);

    const roles = (roleRows ?? []).map((r) => r.role as string);
    const isApprover = roles.some((r) => APPROVER_ROLES.includes(r));

    await tmp.auth.signOut();

    if (!isApprover) {
      return { approved: false as const, reason: "Tài khoản này không có quyền phê duyệt." };
    }
    return { approved: true as const, approver: data.email };
  });
