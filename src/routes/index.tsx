import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Sparkles, ChevronRight, ShoppingCart, ArrowRight } from "lucide-react";
import { CATEGORIES, PRODUCTS, formatVND } from "@/lib/site";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";

export const Route = createFileRoute("/")({
  component: MobileStoreHome,
});

const BANNERS = [
  {
    title: "MÙA HÈ RỰC RỠ",
    subtitle: "Giảm đến 30% bộ sưu tập Active & Swimwear",
    color: "from-rose-500 to-orange-500",
    tag: "Fashion Drop",
  },
  {
    title: "DA KHỎE DÁNG XINH",
    subtitle: "Mỹ phẩm organic & Thực phẩm xanh thuần chay",
    color: "from-teal-600 to-emerald-500",
    tag: "Healthy Living",
  },
  {
    title: "RICGY PARTNER",
    subtitle: "Đăng ký đối tác phân phối doanh số khủng",
    color: "from-violet-600 to-fuchsia-600",
    tag: "Affiliate Hub",
  },
];

function MobileStoreHome() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [bannerIndex, setBannerIndex] = useState(0);

  // Group all products into a flat list
  const allProducts = Object.entries(PRODUCTS).flatMap(([category, items]) =>
    items.map((p) => ({ ...p, category }))
  );

  const filteredProducts = activeTab === "all" 
    ? allProducts.slice(0, 8) 
    : allProducts.filter((p) => p.category === activeTab);

  const handleQuickAdd = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Default color & size for quick add
    const defaultColor = product.colors[0] || "natural";
    const defaultSize = product.sizes[0] || null;
    addToCart(product, 1, defaultSize, defaultColor);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  return (
    <div className="px-4 pb-12 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="font-serif text-3xl tracking-tight text-foreground font-bold">RICGY</span>
          <span className="font-mono text-xs text-[var(--fuchsia-pop)] ml-1.5 uppercase tracking-widest font-semibold">energetic</span>
        </div>
        <Link to="/gio-hang" className="relative p-2 text-foreground bg-secondary/50 rounded-full hover:bg-secondary transition">
          <ShoppingBag className="size-5" />
        </Link>
      </div>

      {/* Instant Search Bar */}
      <div 
        onClick={() => navigate({ to: "/tim-kiem" })}
        className="flex items-center gap-3 bg-secondary/40 border border-border px-4 py-3 rounded-2xl cursor-pointer hover:bg-secondary/60 transition"
      >
        <Search className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Bạn đang tìm thời trang, mỹ phẩm, granola...?</span>
      </div>

      {/* Banner Carousel */}
      <div className="relative h-44 rounded-3xl overflow-hidden shadow-md">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 flex items-end p-5"
        >
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${BANNERS[bannerIndex].color} opacity-90`} />
          <div className="relative z-10 text-white space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
              {BANNERS[bannerIndex].tag}
            </span>
            <h2 className="font-serif text-2xl font-bold leading-tight pt-1">
              {BANNERS[bannerIndex].title}
            </h2>
            <p className="text-xs opacity-90">{BANNERS[bannerIndex].subtitle}</p>
          </div>
        </div>
        
        {/* Banner Pagination dots */}
        <div className="absolute top-4 right-4 flex gap-1.5 z-20">
          {BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setBannerIndex(idx)}
              className={`size-2 rounded-full transition-all ${
                bannerIndex === idx ? "bg-white w-4" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Categories quick links (grid) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold">Danh mục sản phẩm</h3>
          <Link to="/danh-muc" className="text-xs text-[var(--fuchsia-pop)] font-semibold flex items-center gap-0.5">
            Xem tất cả <ChevronRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Fashion Category */}
          <div 
            onClick={() => { setActiveTab("cong-so"); }}
            className={`p-3 rounded-2xl border text-center cursor-pointer transition ${
              activeTab === "cong-so" || activeTab === "the-thao" || activeTab === "dam-di-choi" || activeTab === "dam-ngu"
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-card border-border text-foreground hover:bg-secondary/20"
            }`}
          >
            <span className="text-2xl block mb-1">👗</span>
            <span className="text-xs font-semibold">Thời trang</span>
          </div>

          {/* Cosmetics Category */}
          <div 
            onClick={() => { setActiveTab("my-pham"); }}
            className={`p-3 rounded-2xl border text-center cursor-pointer transition ${
              activeTab === "my-pham" 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-card border-border text-foreground hover:bg-secondary/20"
            }`}
          >
            <span className="text-2xl block mb-1">💄</span>
            <span className="text-xs font-semibold">Mỹ phẩm</span>
          </div>

          {/* Food Category */}
          <div 
            onClick={() => { setActiveTab("thuc-pham"); }}
            className={`p-3 rounded-2xl border text-center cursor-pointer transition ${
              activeTab === "thuc-pham" 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-card border-border text-foreground hover:bg-secondary/20"
            }`}
          >
            <span className="text-2xl block mb-1">🥗</span>
            <span className="text-xs font-semibold">Thực phẩm</span>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold flex items-center gap-1.5">
            <Sparkles className="size-4 text-amber-500 fill-amber-500" />
            Gợi ý dành riêng cho bạn
          </h3>
        </div>

        {/* Chips bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition shrink-0 ${
              activeTab === "all"
                ? "bg-foreground text-background border-foreground"
                : "bg-secondary/35 text-foreground border-border"
            }`}
          >
            Tất cả
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => setActiveTab(c.slug)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition shrink-0 ${
                activeTab === c.slug
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary/35 text-foreground border-border"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((p, idx) => (
              <motion.div
                layout
                key={p.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                className="group relative bg-card rounded-2xl overflow-hidden border border-border flex flex-col shadow-xs"
              >
                <Link to={`/san-pham/${p.id}`} className="block flex-1">
                  {/* Image wrapper */}
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="size-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {p.badge && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-primary text-primary-foreground">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  {/* Info block */}
                  <div className="p-3 space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground block">
                      {CATEGORIES.find((c) => c.slug === p.category)?.name || p.category}
                    </span>
                    <h4 className="text-xs font-bold line-clamp-2 text-foreground group-hover:text-[var(--fuchsia-pop)] transition">
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-xs font-bold text-foreground">
                        {formatVND(p.price)}
                      </span>
                      {p.oldPrice && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatVND(p.oldPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Quick Add Button */}
                <button
                  onClick={(e) => handleQuickAdd(p, e)}
                  className="absolute bottom-3 right-3 p-2 bg-foreground text-background rounded-full hover:bg-[var(--fuchsia-pop)] hover:text-white transition shadow-sm z-10 cursor-pointer"
                  title="Thêm nhanh vào giỏ"
                >
                  <ShoppingCart className="size-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Promo banner to Admin Panel */}
      <div className="bg-linear-to-r from-teal-900 to-primary text-white p-5 rounded-3xl space-y-3 relative overflow-hidden shadow-md">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
          <Sparkles className="size-40" />
        </div>
        <span className="text-[9px] uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full font-bold">
          Partner Program
        </span>
        <h4 className="font-serif text-xl font-bold leading-tight">
          Hệ Thống Phân Phối Đối Tác
        </h4>
        <p className="text-xs text-white/80 max-w-[75%]">
          Quản lý doanh số bán hàng, chiết khấu hoa hồng đại lý và theo dõi hiệu suất tức thì.
        </p>
        <Link 
          to="/login" 
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-primary px-4 py-2 rounded-full hover:bg-neutral-100 transition shadow-sm"
        >
          Vào Trang Quản Trị <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
