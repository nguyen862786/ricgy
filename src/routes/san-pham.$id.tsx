import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  PRODUCTS,
  CATEGORIES,
  COLOR_META,
  FIT_META,
  SITE,
  formatVND,
  type Product,
  type SizeKey,
  type ColorKey,
} from "@/lib/site";
import { Reveal } from "@/components/site/Reveal";
import { ProductCard } from "@/components/site/ProductCard";
import { ArrowRight, Ruler, MessageCircle, Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

type Found = { product: Product; categorySlug: string };

function findProduct(id: string): Found | null {
  for (const slug of Object.keys(PRODUCTS)) {
    const p = PRODUCTS[slug].find((x) => x.id === id);
    if (p) return { product: p, categorySlug: slug };
  }
  return null;
}

export const Route = createFileRoute("/san-pham/$id")({
  loader: ({ params }) => {
    const f = findProduct(params.id);
    if (!f) throw notFound();
    return f;
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    return {
      meta: p
        ? [
            { title: `${p.name} — RICGY` },
            { name: "description", content: `${p.name} — ${formatVND(p.price)}. Đặt qua Zalo, tư vấn size miễn phí.` },
            { property: "og:title", content: `${p.name} — RICGY` },
            { property: "og:image", content: p.image },
            { property: "twitter:image", content: p.image },
          ]
        : [{ title: "Sản phẩm — RICGY" }],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-[60vh] flex items-center justify-center px-5">
      <div className="text-center">
        <p className="font-mono-tag text-[11px] uppercase text-[var(--fuchsia-pop)]">404</p>
        <h1 className="mt-4 font-display text-5xl">Không tìm thấy outfit</h1>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-mono-tag text-[11px] uppercase">
          Về trang chủ <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-[50vh] flex items-center justify-center px-5">
      <p className="font-serif text-2xl">Có lỗi xảy ra: {error.message}</p>
    </div>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { product, categorySlug } = Route.useLoaderData() as Found;
  const cat = CATEGORIES.find((c) => c.slug === categorySlug)!;
  const [size, setSize] = useState<SizeKey | null>(null);
  const [color, setColor] = useState<ColorKey>(product.colors[0]);
  const { addToCart } = useCart();

  const related = PRODUCTS[categorySlug].filter((p) => p.id !== product.id).slice(0, 4);

  const zaloMsg = encodeURIComponent(
    `Em chào RICGY, em muốn đặt: ${product.name} (${formatVND(product.price)})${size ? ` — size ${size}` : ""} — màu ${COLOR_META[color].label}.`
  );
  const zaloLink = `${SITE.zalo}?text=${zaloMsg}`;

  const handleAddToCart = () => {
    const isFashion = ["cong-so", "the-thao", "dam-di-choi", "dam-ngu"].includes(categorySlug);
    if (isFashion && !size) {
      toast.error("Vui lòng chọn Size trước khi thêm!");
      return;
    }
    addToCart(product, 1, size, color);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="px-5 lg:px-10 pt-24 lg:pt-28">
        <nav className="font-mono-tag text-[10px] uppercase text-muted-foreground flex gap-2">
          <Link to="/" className="hover:text-foreground">Trang chủ</Link>
          <span>/</span>
          <Link to={`/${cat.slug}` as never} className="hover:text-foreground">{cat.name}</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      {/* Main */}
      <section className="px-5 lg:px-10 pt-6 pb-16 lg:pb-24">
        <div className="mx-auto max-w-[1400px] grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image */}
          <div className="relative bg-muted aspect-[3/4] overflow-hidden border border-foreground/10">
            <img src={product.image} alt={product.name} className="absolute inset-0 size-full object-cover" />
            {product.badge && (
              <span className="absolute top-4 left-4 px-3 py-1 font-mono-tag text-[10px] uppercase bg-foreground text-background">
                {product.badge}
              </span>
            )}
            <div className="absolute inset-4 border border-[var(--fuchsia-pop)]/40 pointer-events-none" />
          </div>

          {/* Info */}
          <div className="lg:py-4">
            <p className="font-mono-tag text-[11px] uppercase text-[var(--fuchsia-pop)]">
              {cat.no} — {cat.name}
            </p>
            <h1 className="mt-3 font-display text-4xl lg:text-6xl leading-[0.95]">{product.name}</h1>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-mono-tag text-2xl">{formatVND(product.price)}</span>
              {product.oldPrice && (
                <span className="text-muted-foreground line-through">{formatVND(product.oldPrice)}</span>
              )}
            </div>

            <div className="mt-8 h-px bg-foreground/10" />

            {/* Phom */}
            <div className="mt-6">
              <p className="font-mono-tag text-[10px] uppercase text-muted-foreground">Phom dáng</p>
              <p className="mt-2 font-serif text-2xl italic">{FIT_META[product.fit]}</p>
            </div>

            {/* Color */}
            <div className="mt-6">
              <p className="font-mono-tag text-[10px] uppercase text-muted-foreground">
                Màu — <span className="text-foreground">{COLOR_META[color].label}</span>
              </p>
              <div className="mt-3 flex gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={COLOR_META[c].label}
                    className={`size-10 border-2 transition ${color === c ? "border-foreground scale-110" : "border-foreground/20 hover:border-foreground/50"}`}
                    style={{ backgroundColor: COLOR_META[c].hex }}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="font-mono-tag text-[10px] uppercase text-muted-foreground">
                  Size {size && <span className="text-foreground">— {size}</span>}
                </p>
                <Link to="/huong-dan-size" className="font-mono-tag text-[10px] uppercase text-[var(--fuchsia-pop)] hover:underline inline-flex items-center gap-1">
                  <Ruler className="size-3" /> Hướng dẫn chọn size
                </Link>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {(["S", "M", "L", "XL"] as SizeKey[]).map((s) => {
                  const available = product.sizes.includes(s);
                  const selected = size === s;
                  return (
                    <button
                      key={s}
                      disabled={!available}
                      onClick={() => setSize(s)}
                      className={`min-w-14 px-4 py-3 font-mono-tag text-sm border transition ${
                        selected
                          ? "bg-foreground text-background border-foreground"
                          : available
                          ? "bg-background text-foreground border-foreground/20 hover:border-foreground"
                          : "text-muted-foreground/40 border-foreground/10 line-through cursor-not-allowed"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {!size && (
                <p className="mt-2 font-mono-tag text-[10px] uppercase text-muted-foreground">
                  * Chọn size trước khi đặt — chưa chắc? Inbox Zalo, RICGY tư vấn theo cân nặng & vóc dáng.
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="mt-8 space-y-3">
              <button
                onClick={handleAddToCart}
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-foreground text-background font-mono-tag text-[12px] uppercase hover:bg-[var(--fuchsia-pop)] transition-colors cursor-pointer animate-pulse"
              >
                <ShoppingCart className="size-4" /> Thêm vào giỏ hàng
              </button>
              <div className="grid sm:grid-cols-2 gap-3">
                <a
                  href={zaloLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-6 py-4 border border-foreground text-foreground font-mono-tag text-[12px] uppercase hover:bg-secondary/40 transition-colors"
                >
                  <MessageCircle className="size-4" /> Đặt ngay qua Zalo
                </a>
                <a
                  href={SITE.messenger}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-6 py-4 border border-foreground/30 text-muted-foreground hover:text-foreground font-mono-tag text-[12px] uppercase hover:bg-secondary/20 transition-colors"
                >
                  Nhắn Messenger
                </a>
              </div>
            </div>

            {/* Perks */}
            <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
              {[
                "Freeship đơn từ 500K nội thành.",
                "Đổi size trong 7 ngày, miễn phí.",
                "Tư vấn 1-1 qua Zalo trước khi chốt.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check className="size-4 mt-0.5 text-[var(--fuchsia-pop)]" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="px-5 lg:px-10 py-16 lg:py-24 bg-secondary/40">
          <div className="mx-auto max-w-[1400px]">
            <p className="font-mono-tag text-[11px] uppercase text-[var(--fuchsia-pop)]">Có thể bạn thích</p>
            <h2 className="mt-3 font-display text-3xl lg:text-5xl">Cùng bộ sưu tập</h2>
            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-8">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 0.05}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
