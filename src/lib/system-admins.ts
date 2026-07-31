// ============================================================================
// SYSTEM SUPER ADMINS — KHÓA CỨNG (HARD-LOCKED)
// ----------------------------------------------------------------------------
// Danh sách email luôn giữ vai trò super_admin (Owner tối cao), bất kể DB
// re-sync, build lại, hay --force push từ Git. Nguồn sự thật được lưu song song
// trong bảng public.system_super_admins (migration) + trigger bảo vệ chống xoá/
// hạ quyền. Hằng số dưới đây là lớp phòng vệ ở client để giao diện luôn cấp
// toàn quyền cho các tài khoản này ngay cả khi role trong DB chưa load xong.
//
// Có thể bổ sung qua biến môi trường VITE_SYSTEM_SUPER_ADMINS (phân tách dấu phẩy)
// nhưng KHÔNG được phép loại bỏ các email mặc định bên dưới.
// ============================================================================

const DEFAULT_SYSTEM_SUPER_ADMINS = ["nguyen862786@gmail.com"] as const;

function fromEnv(): string[] {
  const raw = import.meta.env.VITE_SYSTEM_SUPER_ADMINS as string | undefined;
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Tập hợp email super-admin cố định (đã chuẩn hóa lowercase). */
export const SYSTEM_SUPER_ADMINS: ReadonlySet<string> = new Set<string>([
  ...DEFAULT_SYSTEM_SUPER_ADMINS.map((e) => e.toLowerCase()),
  ...fromEnv(),
]);

/** Email này có phải super-admin khóa cứng không? */
export function isSystemSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return SYSTEM_SUPER_ADMINS.has(email.toLowerCase());
}
