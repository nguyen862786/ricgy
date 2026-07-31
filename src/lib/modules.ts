// ============================================================================
// DANH MỤC MODULE TÍNH NĂNG (Feature Modules) — dùng cho Super Admin bật/tắt
// theo từng doanh nghiệp (tenant_modules). Mặc định: module BẬT khi chưa có
// bản ghi (khớp với hàm DB is_module_enabled()).
// ============================================================================

export interface ModuleDef {
  key: string;
  label: string;
  description: string;
}

export const MODULE_CATALOG: ModuleDef[] = [
  { key: "pos", label: "POS bán quầy", description: "Màn hình bán hàng tại quầy & chốt ca." },
  { key: "inventory", label: "Kho vận", description: "Nhập / xuất / kiểm kho." },
  { key: "bom", label: "Sản xuất / BOM", description: "Định mức nguyên vật liệu & sản xuất." },
  { key: "promotions", label: "Khuyến mãi & Voucher", description: "Mã giảm giá, voucher QiClub." },
  {
    key: "reports",
    label: "Báo cáo & Đối soát",
    description: "Báo cáo doanh thu, đối soát công nợ.",
  },
  { key: "marketing", label: "Marketing", description: "Chiến dịch, popup, automation." },
  { key: "wallet", label: "Ví & Affiliate", description: "Ví điểm, hoa hồng đại lý, rút tiền." },
  {
    key: "hotel",
    label: "Khách sạn (Đặt phòng)",
    description: "Nghiệp vụ đặt/trả phòng khách sạn.",
  },
  { key: "fashion", label: "Thời trang", description: "Ma trận màu sắc × kích cỡ." },
  { key: "tax", label: "Cổng thuế / HĐĐT", description: "Hoá đơn điện tử & cổng thuế." },
  {
    key: "vegan",
    label: "Thực phẩm chay",
    description: "Chuỗi cung ứng & POS thực phẩm chay (Xưởng → Chùa → Người tiêu dùng).",
  },
];

export const MODULE_LABEL: Record<string, string> = Object.fromEntries(
  MODULE_CATALOG.map((m) => [m.key, m.label]),
);

// Base path -> module key. Route không khai báo => luôn hiển thị (chỉ chịu RBAC).
export const ROUTE_MODULE: Record<string, string> = {
  "/pos": "pos",
  "/shifts": "pos",
  "/inventory": "inventory",
  "/promos": "promotions",
  "/reports": "reports",
  "/marketing": "marketing",
  "/wallet": "wallet",
  "/affiliate": "wallet",
  "/withdrawals": "wallet",
  "/hotel": "hotel",
  "/hotel/guest-portal": "hotel",
  "/hotel/chat": "hotel",
  "/fashion": "fashion",
  "/fashion/ai-fitting": "fashion",
  "/fashion/returns": "fashion",
  "/fashion/accessories": "fashion",
  "/vegan": "vegan",
};

/** Tìm module ứng với 1 pathname (khớp path gốc dài nhất). */
export function moduleForRoute(pathname: string): string | null {
  if (ROUTE_MODULE[pathname]) return ROUTE_MODULE[pathname];
  let best: { base: string; key: string } | null = null;
  for (const base of Object.keys(ROUTE_MODULE)) {
    if (pathname === base || pathname.startsWith(base + "/")) {
      if (!best || base.length > best.base.length) best = { base, key: ROUTE_MODULE[base] };
    }
  }
  return best?.key ?? null;
}
