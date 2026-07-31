import catOffice from "@/assets/cat-office.jpg";
import catSport from "@/assets/cat-sport.jpg";
import catParty from "@/assets/cat-party.jpg";
import catSleep from "@/assets/cat-sleep.jpg";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";

export const SITE = {
  name: "RICGY",
  tagline: "energetic",
  zalo: "https://zalo.me/0000000000",
  messenger: "https://m.me/RICObyPhuongUyen",
  facebook: "https://www.facebook.com/RICObyPhuongUyen/",
  instagram: "https://instagram.com/",
  phone: "0000 000 000",
  email: "hello@ricgy.vn",
  address: "Showroom RICGY, Việt Nam",
};

export const CATEGORIES = [
  { slug: "cong-so",     no: "01", name: "Công sở",     sub: "Office",         desc: "Thanh lịch, tự tin trong từng chuyển động." },
  { slug: "the-thao",    no: "02", name: "Thể thao",    sub: "Active",         desc: "Năng động cho gym, tennis, golf và yoga." },
  { slug: "dam-di-choi", no: "03", name: "Đầm đi chơi", sub: "Daily & Party",  desc: "Lung linh trong mọi cuộc hẹn." },
  { slug: "dam-ngu",     no: "04", name: "Đầm ngủ",     sub: "Sleepwear",      desc: "Mềm mại, dịu dàng cho giấc ngủ thật êm." },
  { slug: "my-pham",     no: "05", name: "Mỹ phẩm",     sub: "Cosmetics",      desc: "Chăm sóc và nâng niu vẻ đẹp tự nhiên." },
  { slug: "thuc-pham",   no: "06", name: "Thực phẩm",   sub: "Healthy Food",   desc: "Dinh dưỡng xanh, sống lành mạnh mỗi ngày." },
] as const;

export type ColorKey = "ink" | "fuchsia" | "teal" | "cream" | "cocoa" | "pastel" | "natural" | "gold" | "rose";
export type FitKey = "om" | "suong" | "xoe" | "crop" | "oversized" | "duong-da" | "trang-diem" | "dinh-duong" | "thuc-duong";
export type SizeKey = "S" | "M" | "L" | "XL" | "30ml" | "50ml" | "100ml" | "150g" | "250g" | "500g" | "1kg";
export type TagKey = "all" | "new" | "hot" | "sale";
export type SortKey = "newest" | "price-asc" | "price-desc";

export type Product = {
  id: string;
  name: string;
  price: number;     // VND
  oldPrice?: number;
  badge?: "New" | "Hot" | "Sale";
  tag: Exclude<TagKey, "all">[];
  colors: ColorKey[];
  fit: FitKey;
  sizes: SizeKey[];
  image: string;
  createdAt: number; // ordering
};

export const COLOR_META: Record<ColorKey, { label: string; hex: string }> = {
  ink:     { label: "Ink Black",  hex: "#0F0F12" },
  fuchsia: { label: "Fuchsia",    hex: "#E91E76" },
  teal:    { label: "Teal",       hex: "#0E5C5E" },
  cream:   { label: "Cream",      hex: "#F4F1EA" },
  cocoa:   { label: "Cocoa",      hex: "#6B4226" },
  pastel:  { label: "Pastel",     hex: "#F4C8D4" },
  natural: { label: "Tự nhiên",    hex: "#8FBC8F" },
  gold:    { label: "Ánh vàng",    hex: "#FFD700" },
  rose:    { label: "Hồng Rose",  hex: "#FFC0CB" },
};

export const FIT_META: Record<FitKey, string> = {
  om: "Ôm body",
  suong: "Dáng suông",
  xoe: "Dáng xòe rộng",
  crop: "Dáng lửng (Crop)",
  oversized: "Rộng rãi (Oversized)",
  "duong-da": "Chăm sóc da",
  "trang-diem": "Trang điểm nhẹ nhàng",
  "dinh-duong": "Dinh dưỡng organic",
  "thuc-duong": "Thanh lọc thực dưỡng",
};

export const formatVND = (n: number) => n.toLocaleString("vi-VN") + " ₫";

// ---- Datasets per category --------------------------------------------------

const t = Date.now();
const day = 86400000;

export const PRODUCTS: Record<string, Product[]> = {
  "cong-so": [
    { id: "co-1", name: "Blazer Ink Power",       price: 1290000,                 badge: "New",  tag: ["new"],         colors: ["ink", "cream"],     fit: "om",        sizes: ["S","M","L"],     image: catOffice, createdAt: t-1*day },
    { id: "co-2", name: "Áo Lụa Cổ V Cream",      price: 590000,                                  tag: [],              colors: ["cream"],            fit: "suong",     sizes: ["S","M","L","XL"],image: p1,        createdAt: t-8*day },
    { id: "co-3", name: "Đầm Sơ Mi Fuchsia",       price: 750000,                 badge: "Hot",  tag: ["hot"],         colors: ["fuchsia"],          fit: "suong",     sizes: ["S","M","L"],     image: p4,        createdAt: t-2*day },
    { id: "co-4", name: "Set Quần Tây Teal",       price: 1150000,                                tag: [],              colors: ["teal","ink"],       fit: "suong",     sizes: ["M","L","XL"],    image: p2,        createdAt: t-12*day },
    { id: "co-5", name: "Áo Kiểu Tay Bồng Cocoa",  price: 490000,                                 tag: [],              colors: ["cocoa","cream"],    fit: "oversized", sizes: ["S","M","L"],     image: p3,        createdAt: t-15*day },
    { id: "co-6", name: "Đầm Suông VP Pastel",     price: 680000, oldPrice: 890000, badge: "Sale", tag: ["sale"],       colors: ["pastel"],           fit: "suong",     sizes: ["S","M","L","XL"],image: p1,        createdAt: t-20*day },
    { id: "co-7", name: "Vest Cream Editorial",    price: 1390000,                                tag: [],              colors: ["cream","ink"],      fit: "om",        sizes: ["M","L"],         image: catOffice, createdAt: t-30*day },
    { id: "co-8", name: "Chân Váy Bút Chì Ink",    price: 450000,                                 tag: [],              colors: ["ink"],              fit: "om",        sizes: ["S","M","L"],     image: p4,        createdAt: t-25*day },
  ],
  "the-thao": [
    { id: "tt-1", name: "Set Tennis Fuchsia",      price: 690000,                 badge: "New",  tag: ["new"],         colors: ["fuchsia","cream"],  fit: "om",        sizes: ["S","M","L"],     image: p3,        createdAt: t-1*day },
    { id: "tt-2", name: "Legging Teal High-Waist", price: 450000,                                 tag: [],              colors: ["teal"],             fit: "om",        sizes: ["S","M","L","XL"],image: catSport,  createdAt: t-3*day },
    { id: "tt-3", name: "Áo Bra Crop Ink",         price: 290000,                 badge: "Hot",  tag: ["hot"],         colors: ["ink"],              fit: "crop",      sizes: ["S","M","L"],     image: p3,        createdAt: t-5*day },
    { id: "tt-4", name: "Set Yoga Cream",          price: 590000, oldPrice: 750000, badge: "Sale", tag: ["sale"],       colors: ["cream","pastel"],   fit: "om",        sizes: ["S","M","L"],     image: catSport,  createdAt: t-10*day },
    { id: "tt-5", name: "Áo Khoác Gió Pickleball", price: 690000,                                 tag: [],              colors: ["fuchsia","ink"],    fit: "oversized", sizes: ["M","L","XL"],    image: p2,        createdAt: t-12*day },
    { id: "tt-6", name: "Quần Short Golf Pastel",  price: 390000,                                 tag: [],              colors: ["pastel"],           fit: "suong",     sizes: ["S","M","L"],     image: p4,        createdAt: t-18*day },
    { id: "tt-7", name: "Set Gym Cocoa",           price: 690000,                                 tag: [],              colors: ["cocoa"],            fit: "om",        sizes: ["S","M","L","XL"],image: catSport,  createdAt: t-22*day },
    { id: "tt-8", name: "Áo Bra Teal Strap",       price: 320000,                                 tag: [],              colors: ["teal"],             fit: "crop",      sizes: ["S","M"],         image: p1,        createdAt: t-28*day },
  ],
  "dam-di-choi": [
    { id: "dc-1", name: "Đầm Bloom Lụa",          price: 850000, oldPrice: 1150000, badge: "New", tag: ["new"],         colors: ["fuchsia","pastel"], fit: "xoe",       sizes: ["S","M","L"],     image: p1,        createdAt: t-1*day },
    { id: "dc-2", name: "Đầm Mini Ink Editorial",  price: 780000,                 badge: "Hot",  tag: ["hot"],         colors: ["ink"],              fit: "om",        sizes: ["S","M","L"],     image: p2,        createdAt: t-2*day },
    { id: "dc-3", name: "Đầm Maxi Teal",           price: 990000,                                 tag: [],              colors: ["teal"],             fit: "xoe",       sizes: ["M","L","XL"],    image: catParty,  createdAt: t-6*day },
    { id: "dc-4", name: "Đầm Crop Fuchsia",        price: 590000,                                 tag: [],              colors: ["fuchsia"],          fit: "crop",      sizes: ["S","M"],         image: p3,        createdAt: t-8*day },
    { id: "dc-5", name: "Đầm Suông Cream",         price: 690000,                                 tag: [],              colors: ["cream"],            fit: "suong",     sizes: ["S","M","L","XL"],image: p4,        createdAt: t-12*day },
    { id: "dc-6", name: "Đầm Đi Chơi Cocoa Vibe",  price: 720000, oldPrice: 890000, badge: "Sale", tag: ["sale"],       colors: ["cocoa"],            fit: "xoe",       sizes: ["S","M","L"],     image: catParty,  createdAt: t-16*day },
    { id: "dc-7", name: "Đầm Ôm Pastel",           price: 650000,                                 tag: [],              colors: ["pastel"],           fit: "om",        sizes: ["S","M","L"],     image: p1,        createdAt: t-20*day },
    { id: "dc-8", name: "Đầm Oversized Ink",       price: 820000,                                 tag: [],              colors: ["ink","cream"],      fit: "oversized", sizes: ["M","L","XL"],    image: p2,        createdAt: t-26*day },
  ],
  "dam-ngu": [
    { id: "dn-1", name: "Đầm Ngủ Lụa Pastel",      price: 520000, oldPrice: 680000, badge: "Sale", tag: ["sale"],       colors: ["pastel"],           fit: "suong",     sizes: ["S","M","L"],     image: p4,        createdAt: t-1*day },
    { id: "dn-2", name: "Set Pijama Cream",        price: 590000,                 badge: "New",  tag: ["new"],         colors: ["cream"],            fit: "suong",     sizes: ["S","M","L","XL"],image: p1,        createdAt: t-2*day },
    { id: "dn-3", name: "Đầm Ngủ Ink Lace",        price: 690000,                 badge: "Hot",  tag: ["hot"],         colors: ["ink"],              fit: "om",        sizes: ["S","M","L"],     image: catSleep,  createdAt: t-5*day },
    { id: "dn-4", name: "Set Pijama Cocoa",        price: 540000,                                 tag: [],              colors: ["cocoa"],            fit: "oversized", sizes: ["S","M","L"],     image: p3,        createdAt: t-9*day },
    { id: "dn-5", name: "Đầm Ngủ Teal Satin",      price: 620000,                                 tag: [],              colors: ["teal"],             fit: "suong",     sizes: ["M","L","XL"],    image: catSleep,  createdAt: t-14*day },
    { id: "dn-6", name: "Áo Robe Fuchsia",         price: 480000,                                 tag: [],              colors: ["fuchsia","pastel"], fit: "oversized", sizes: ["S","M","L"],     image: p2,        createdAt: t-18*day },
    { id: "dn-7", name: "Đầm Ngủ Slip Cream",      price: 450000,                                 tag: [],              colors: ["cream"],            fit: "om",        sizes: ["S","M","L"],     image: p4,        createdAt: t-23*day },
    { id: "dn-8", name: "Set Pijama Pastel",       price: 560000,                                 tag: [],              colors: ["pastel","cream"],   fit: "suong",     sizes: ["S","M","L","XL"],image: p1,        createdAt: t-30*day },
  ],
  "my-pham": [
    { id: "mp-1", name: "Serum HA B5 Phục Hồi",    price: 350000, oldPrice: 420000, badge: "New",  tag: ["new"],         colors: ["natural"],          fit: "duong-da",  sizes: ["30ml","50ml"],   image: p1,        createdAt: t-1*day },
    { id: "mp-2", name: "Kem Chống Nắng Multi-SPF",price: 390000,                 badge: "Hot",  tag: ["hot"],         colors: ["cream"],            fit: "duong-da",  sizes: ["50ml"],          image: p2,        createdAt: t-3*day },
    { id: "mp-3", name: "Son Kem Lì Velvet Rose",  price: 280000, oldPrice: 350000, badge: "Sale", tag: ["sale"],       colors: ["fuchsia","rose"],   fit: "trang-diem",sizes: ["S"],             image: p3,        createdAt: t-4*day },
    { id: "mp-4", name: "Nước Tẩy Trang Centella", price: 220000,                                 tag: [],              colors: ["natural"],          fit: "duong-da",  sizes: ["100ml"],         image: p4,        createdAt: t-9*day },
  ],
  "thuc-pham": [
    { id: "tp-1", name: "Granola Siêu Hạt Organic", price: 185000, oldPrice: 220000, badge: "New",  tag: ["new"],        colors: ["natural"],          fit: "dinh-duong",sizes: ["250g","500g"],   image: p2,        createdAt: t-1*day },
    { id: "tp-2", name: "Trà Đậu Đỏ Gạo Lứt",      price: 120000,                 badge: "Sale", tag: ["sale"],       colors: ["cocoa"],            fit: "thuc-duong",sizes: ["250g"],          image: p4,        createdAt: t-6*day },
    { id: "tp-3", name: "Mật Ong Rừng U Minh",     price: 320000,                 badge: "Hot",  tag: ["hot"],         colors: ["gold"],             fit: "dinh-duong",sizes: ["500g","1kg"],    image: p1,        createdAt: t-8*day },
    { id: "tp-4", name: "Hạt Điều Rang Cát",       price: 160000,                                 tag: [],              colors: ["cream"],            fit: "dinh-duong",sizes: ["250g","500g"],   image: p3,        createdAt: t-12*day },
  ],
};
