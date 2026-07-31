// ============================================================================
// HỆ THỐNG PHÂN QUYỀN (RBAC) — 4 NHÓM TÀI KHOẢN
// ----------------------------------------------------------------------------
// 1. super_admin  : Quản trị toàn hệ thống SaaS (kích hoạt gói, bật/tắt module
//                   theo ngành, theo dõi dòng tiền thu phí phần cứng/phần mềm).
// 2. tenant_owner : Chủ doanh nghiệp — toàn quyền trên mọi trang nghiệp vụ.
// 3. store_manager: Quản lý cửa hàng — bị giới hạn, dữ liệu auto lọc theo store.
// 4. cashier      : Thu ngân / nhân viên bán hàng — chỉ POS, Chốt ca, tạo đơn.
// ============================================================================

export type AppRole =
  | "super_admin"
  | "owner"
  | "admin"
  | "store_manager"
  | "cashier"
  | "agent"
  | "affiliate"
  | "customer";

export type AccessGroup = "super_admin" | "tenant_owner" | "store_manager" | "cashier" | "none";

export const ACCESS_GROUP_LABEL: Record<AccessGroup, string> = {
  super_admin: "Super Admin",
  tenant_owner: "Chủ doanh nghiệp",
  store_manager: "Quản lý cửa hàng",
  cashier: "Thu ngân / Nhân viên",
  none: "Khách",
};

/** Suy ra nhóm quyền cao nhất từ danh sách role của user. */
export function getAccessGroup(roles: AppRole[]): AccessGroup {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("owner") || roles.includes("admin")) return "tenant_owner";
  if (roles.includes("store_manager")) return "store_manager";
  if (roles.includes("cashier")) return "cashier";
  return "none";
}

// Base path -> các nhóm quyền được phép truy cập.
// Path con (vd /customers/123) kế thừa quyền của path gốc /customers.
export const ROUTE_ACCESS: Record<string, AccessGroup[]> = {
  "/dashboard": ["super_admin", "tenant_owner", "store_manager"],
  "/products": ["super_admin", "tenant_owner", "store_manager"],
  "/promos": ["super_admin", "tenant_owner"],
  "/customers": ["super_admin", "tenant_owner", "store_manager"],
  "/tiers": ["super_admin", "tenant_owner"],
  "/affiliate": ["super_admin", "tenant_owner", "store_manager"],
  "/orders": ["super_admin", "tenant_owner", "store_manager", "cashier"],
  "/reports": ["super_admin", "tenant_owner", "store_manager"],
  "/survey-stats": ["super_admin", "tenant_owner", "store_manager"],
  "/stores": ["super_admin", "tenant_owner", "store_manager"],
  "/users": ["super_admin", "tenant_owner", "store_manager"],
  "/marketing": ["super_admin", "tenant_owner"],
  "/settings": ["super_admin", "tenant_owner"],
  "/wallet": ["super_admin", "tenant_owner"],
  "/withdrawals": ["super_admin", "tenant_owner"],
  "/pos": ["super_admin", "tenant_owner", "store_manager", "cashier"],
  "/shifts": ["super_admin", "tenant_owner", "store_manager", "cashier"],
  "/inventory": ["super_admin", "tenant_owner", "store_manager"],
  "/billing": ["super_admin"],
  "/super-admin": ["super_admin"],
  "/hotel": ["super_admin", "tenant_owner", "store_manager"],
  "/fashion": ["super_admin", "tenant_owner", "store_manager", "cashier"],
  "/vegan": ["super_admin", "tenant_owner", "store_manager", "cashier"],
};

/** Tìm cấu hình quyền cho 1 pathname (khớp path gốc dài nhất). */
function matchRoute(pathname: string): AccessGroup[] | null {
  if (ROUTE_ACCESS[pathname]) return ROUTE_ACCESS[pathname];
  let best: { base: string; groups: AccessGroup[] } | null = null;
  for (const base of Object.keys(ROUTE_ACCESS)) {
    if (pathname === base || pathname.startsWith(base + "/")) {
      if (!best || base.length > best.base.length) best = { base, groups: ROUTE_ACCESS[base] };
    }
  }
  return best?.groups ?? null;
}

/** Nhóm quyền `group` có được vào `pathname` không. */
export function canAccessRoute(group: AccessGroup, pathname: string): boolean {
  const groups = matchRoute(pathname);
  if (!groups) return true; // route không khai báo -> mặc định cho qua (vd 404)
  return groups.includes(group);
}

/** Trang mặc định khi đăng nhập / khi bị chặn truy cập. */
export function defaultRouteFor(group: AccessGroup): string {
  if (group === "cashier") return "/pos";
  if (group === "none") return "/";
  return "/dashboard";
}

// --- Quyền thao tác (không phải route) -------------------------------------

/** Được phép Hủy đơn / Hoàn tiền / Đổi trả (cashier KHÔNG được, cần phê duyệt). */
export function canManageOrderLifecycle(group: AccessGroup): boolean {
  return group === "super_admin" || group === "tenant_owner" || group === "store_manager";
}

/** Dữ liệu bị giới hạn theo store được chỉ định. */
export function isStoreScoped(group: AccessGroup): boolean {
  return group === "store_manager" || group === "cashier";
}

/** Role được phép phê duyệt (nhập mật khẩu) cho thao tác nhạy cảm. */
export function canApprove(group: AccessGroup): boolean {
  return canManageOrderLifecycle(group);
}
