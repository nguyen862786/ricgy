// ============================================================================
// MODULE THỰC PHẨM CHAY — hằng số & công thức dùng chung
// Mô hình: Xưởng sản xuất -> Kho vệ tinh (Chùa) -> Người tiêu dùng
// ============================================================================

/** Mục tiêu phủ sóng toàn hệ thống. */
export const COVERAGE_TARGET = 500;

export type VeganCategory = "cha_chay" | "nhu_yeu_pham";
export type StorageCondition = "frozen" | "dry";
export type TempleStatus = "signed" | "negotiating";
export type CharityMode = "percent" | "fixed";

// ============================================================================
// VÒNG ĐỜI TRẠNG THÁI ĐƠN HÀNG
// Khách đặt -> Xác nhận -> Soạn hàng -> Đang giao -> Đã giao xong (hoặc Hủy)
// ============================================================================
export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "delivering"
  | "delivered"
  | "cancelled"
  // trạng thái cũ (tương thích ngược)
  | "pending"
  | "routed"
  | "completed";

/** Các bước chính theo thứ tự của vòng đời giao hàng. */
export const ORDER_FLOW: OrderStatus[] = [
  "placed",
  "confirmed",
  "preparing",
  "delivering",
  "delivered",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Khách đặt hàng",
  confirmed: "Đã xác nhận",
  preparing: "Chùa soạn hàng",
  delivering: "Đang giao",
  delivered: "Đã giao xong",
  cancelled: "Đã hủy",
  pending: "Chờ xử lý",
  routed: "Đã định tuyến",
  completed: "Hoàn tất",
};

/** Chuẩn hoá trạng thái cũ về bước tương ứng trong vòng đời mới. */
export function normalizeStatus(s: string): OrderStatus {
  if (s === "completed") return "delivered";
  if (s === "routed") return "confirmed";
  if (s === "pending") return "placed";
  return s as OrderStatus;
}

/** Chỉ số bước hiện tại trong ORDER_FLOW (-1 nếu đã hủy / không thuộc luồng). */
export function flowIndex(s: string): number {
  return ORDER_FLOW.indexOf(normalizeStatus(s));
}

/** Trạng thái kế tiếp khả dĩ (null nếu đã giao xong hoặc đã hủy). */
export function nextStatus(s: string): OrderStatus | null {
  const i = flowIndex(s);
  if (i < 0 || i >= ORDER_FLOW.length - 1) return null;
  return ORDER_FLOW[i + 1];
}

/** SLA dự kiến (giờ) từ lúc đặt tới khi giao xong, theo kênh bán. */
export function estimatedHours(channel: string): number {
  return channel === "online" ? 48 : 1;
}

/** Mốc thời gian giao dự kiến tính từ thời điểm đặt. */
export function estimateDeliveryAt(channel: string, from: Date = new Date()): string {
  return new Date(from.getTime() + estimatedHours(channel) * 3_600_000).toISOString();
}

export const CATEGORY_LABEL: Record<VeganCategory, string> = {
  cha_chay: "Chả chay (mít)",
  nhu_yeu_pham: "Nhu yếu phẩm",
};

export const STORAGE_LABEL: Record<StorageCondition, string> = {
  frozen: "Hàng đông lạnh",
  dry: "Hàng khô",
};

export const TEMPLE_STATUS_LABEL: Record<TempleStatus, string> = {
  signed: "Đã ký kết",
  negotiating: "Đang thương thảo",
};

/** Hoa hồng kết nối trả cho Trụ trì/Sư của Chùa. */
export function commissionOf(subtotal: number, rate: number) {
  return Math.round((subtotal * (rate || 0)) / 100);
}

/** Số tiền trích quỹ từ thiện cho 1 đơn theo cấu hình của Chùa. */
export function charityOf(
  subtotal: number,
  mode: CharityMode,
  percent: number,
  fixedMonthly: number,
) {
  if (mode === "percent") return Math.round((subtotal * (percent || 0)) / 100);
  // Quỹ cố định/tháng -> phân bổ ~30 ngày để ước tính theo đơn.
  return Math.round((fixedMonthly || 0) / 30);
}

/** Số ngày còn lại tới hạn sử dụng (âm = đã hết hạn). */
export function daysUntil(date: string | null | undefined): number {
  if (!date) return Infinity;
  const ms = new Date(date).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export type ExpiryLevel = "expired" | "soon" | "ok";
export function expiryLevel(date: string | null | undefined): ExpiryLevel {
  const d = daysUntil(date);
  if (d < 0) return "expired";
  if (d <= 7) return "soon";
  return "ok";
}

/** YYYY-MM của hiện tại. */
export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Định tuyến đơn online: ưu tiên Chùa đã ký kết, cùng khu vực, còn tồn kho;
 * nếu không có thì lấy Chùa đã ký kết còn nhiều hàng nhất.
 */
export function routeNearestTemple<
  T extends { id: string; region: string | null; status: string },
>(temples: T[], region: string, stockByTemple: Record<string, number>): T | null {
  const eligible = temples.filter((t) => t.status === "signed" && (stockByTemple[t.id] ?? 0) > 0);
  if (eligible.length === 0) return null;
  const sameRegion = eligible.find(
    (t) => (t.region ?? "").trim().toLowerCase() === region.trim().toLowerCase(),
  );
  if (sameRegion) return sameRegion;
  return eligible.sort((a, b) => (stockByTemple[b.id] ?? 0) - (stockByTemple[a.id] ?? 0))[0];
}