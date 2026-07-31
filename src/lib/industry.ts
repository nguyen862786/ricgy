export type IndustryKey = "fnb" | "beverage" | "hotel" | "fashion";

export interface IndustryField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "date";
  options?: string[];
}

export interface IndustryConfig {
  key: IndustryKey;
  label: string;
  emoji: string;
  /** Mô tả ngắn cho khu vực biến thể */
  variantHint: string;
  /** Thuộc tính của 1 biến thể sản phẩm */
  variantFields: IndustryField[];
  /** Trường bổ sung trên từng dòng đơn hàng */
  orderLineFields: IndustryField[];
}

export const INDUSTRIES: Record<IndustryKey, IndustryConfig> = {
  fnb: {
    key: "fnb",
    label: "F&B (Cafe/Bánh)",
    emoji: "☕",
    variantHint: "Cấu hình Size, Mức đá, Mức đường, Topping cho từng món.",
    variantFields: [
      { key: "size", label: "Size", type: "select", options: ["S", "M", "L"] },
      { key: "ice", label: "Mức đá", type: "select", options: ["100%", "70%", "50%", "0%"] },
      { key: "sugar", label: "Mức đường", type: "select", options: ["100%", "70%", "50%", "0%"] },
      { key: "topping", label: "Topping", type: "text" },
    ],
    orderLineFields: [
      { key: "ice", label: "Đá", type: "select", options: ["100%", "70%", "50%", "0%"] },
      { key: "topping", label: "Topping", type: "text" },
    ],
  },
  beverage: {
    key: "beverage",
    label: "Nước đóng chai",
    emoji: "🧴",
    variantHint: "Cấu hình quy cách đóng gói và dung tích.",
    variantFields: [
      { key: "pack", label: "Quy cách", type: "select", options: ["Chai lẻ", "Lốc 6", "Thùng 24"] },
      { key: "volume", label: "Dung tích", type: "select", options: ["330ml", "500ml", "1.5L"] },
    ],
    orderLineFields: [
      { key: "pack", label: "Quy cách", type: "select", options: ["Chai lẻ", "Lốc 6", "Thùng 24"] },
    ],
  },
  hotel: {
    key: "hotel",
    label: "Khách sạn",
    emoji: "🏨",
    variantHint: "Cấu hình loại phòng và loại giường.",
    variantFields: [
      {
        key: "room_type",
        label: "Loại phòng",
        type: "select",
        options: ["Standard", "Deluxe", "Suite"],
      },
      { key: "bed", label: "Loại giường", type: "select", options: ["Đơn", "Đôi", "Twin"] },
    ],
    orderLineFields: [
      { key: "check_in", label: "Ngày nhận phòng", type: "date" },
      { key: "check_out", label: "Ngày trả phòng", type: "date" },
      { key: "nights", label: "Số đêm", type: "number" },
    ],
  },
  fashion: {
    key: "fashion",
    label: "Thời trang",
    emoji: "👕",
    variantHint: "Cấu hình ma trận Màu sắc × Kích cỡ.",
    variantFields: [
      { key: "color", label: "Màu sắc", type: "text" },
      {
        key: "size",
        label: "Kích cỡ",
        type: "select",
        options: ["XS", "S", "M", "L", "XL", "XXL"],
      },
    ],
    orderLineFields: [
      { key: "color", label: "Màu", type: "text" },
      { key: "size", label: "Size", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] },
    ],
  },
};

export const INDUSTRY_LIST = [INDUSTRIES.fashion];

export function industryOf(key: string | null | undefined): IndustryConfig {
  return INDUSTRIES[(key as IndustryKey) ?? "fashion"] ?? INDUSTRIES.fashion;
}
