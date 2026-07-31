import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, ShoppingCart, Sparkles } from "lucide-react";
import { PRODUCTS, formatVND } from "@/lib/site";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

export const Route = createFileRoute("/tim-kiem")({
  component: SearchProducts,
});

const HOT_TAGS = ["Granola", "Blazer", "Serum B5", "Đầm ngủ", "Mật ong", "Thể thao"];

function SearchProducts() {
  const [query, setQuery] = useState("");
  const { addToCart } = useCart();

  // Flatten products
  const flatProducts = useMemo(() => {
    return Object.entries(PRODUCTS).flatMap(([category, items]) =>
      items.map((p) => ({ ...p, category }))
    );
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const normalizedQuery = query.toLowerCase().trim();
    return flatProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.fit.toLowerCase().includes(normalizedQuery) ||
        p.id.toLowerCase().includes(normalizedQuery)
    );
  }, [query, flatProducts]);

  const handleQuickAdd = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultColor = product.colors[0] || "natural";
    const defaultSize = product.sizes[0] || null;
    addToCart(product, 1, defaultSize, defaultColor);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  return (
    <div className="px-4 pb-12 space-y-6">
      {/* Search Input Bar */}
      <div className="pt-2 space-y-2">
        <h1 className="font-serif text-2xl font-bold">Tìm kiếm sản phẩm</h1>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm thời trang, mỹ phẩm, thực phẩm..."
            className="w-full bg-secondary/30 border border-border rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-primary transition"
            autoFocus
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        </div>
      </div>

      {/* Conditional Content */}
      {query.trim() === "" ? (
        <div className="space-y-5">
          {/* Hot Tags */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500 fill-amber-500" />
              Từ khóa tìm kiếm hot
            </h4>
            <div className="flex flex-wrap gap-2">
              {HOT_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3.5 py-1.5 bg-secondary/40 text-foreground text-xs rounded-full border border-border hover:bg-secondary transition font-semibold"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick instructions */}
          <div className="bg-secondary/10 p-5 rounded-2xl border border-border/40 text-center">
            <span className="text-2xl block mb-2">🔍</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nhập tên sản phẩm hoặc loại sản phẩm để tìm kiếm nhanh chóng trên toàn hệ thống cửa hàng RICGY.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Kết quả tìm thấy ({results.length})</span>
          </div>

          {/* Search results list */}
          <div className="space-y-3">
            {results.map((p) => (
              <div
                key={p.id}
                className="relative bg-card border border-border rounded-2xl p-3 flex gap-3 group hover:border-primary transition shadow-xs"
              >
                <Link to={`/san-pham/${p.id}`} className="flex flex-1 gap-3 min-w-0">
                  {/* Image */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="size-16 rounded-xl object-cover bg-muted shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-8">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">
                      {p.category}
                    </span>
                    <h4 className="text-xs font-bold text-foreground truncate group-hover:text-[var(--fuchsia-pop)] transition">
                      {p.name}
                    </h4>
                    <p className="text-xs font-bold text-foreground pt-1">
                      {formatVND(p.price)}
                    </p>
                  </div>
                </Link>

                {/* Add to Cart button */}
                <button
                  onClick={(e) => handleQuickAdd(p, e)}
                  className="absolute right-3 bottom-3 p-2 bg-foreground text-background rounded-full hover:bg-[var(--fuchsia-pop)] hover:text-white transition shadow-xs z-10 cursor-pointer"
                  title="Thêm vào giỏ"
                >
                  <ShoppingCart className="size-3.5" />
                </button>
              </div>
            ))}

            {results.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <span className="text-3xl block mb-2">📭</span>
                <p className="text-sm">Không tìm thấy sản phẩm phù hợp.</p>
                <p className="text-xs opacity-75 mt-1">Hãy thử bằng một từ khóa khác.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
