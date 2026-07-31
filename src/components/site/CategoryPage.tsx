import { Link } from "@tanstack/react-router";
import { CATEGORIES, SITE, type Product } from "@/lib/site";
import { Reveal } from "./Reveal";
import { ProductCard } from "./ProductCard";
import { ArrowRight } from "lucide-react";
import {
  ProductFilters,
  applyFilters,
  DEFAULT_FILTERS,
  type FilterValue,
} from "./ProductFilters";

export function CategoryPage({
  slug,
  heroImage,
  products,
  intro,
  filters,
  onFiltersChange,
}: {
  slug: (typeof CATEGORIES)[number]["slug"];
  heroImage: string;
  products: Product[];
  intro: string;
  filters: FilterValue;
  onFiltersChange: (v: FilterValue) => void;
}) {
  const cat = CATEGORIES.find((c) => c.slug === slug)!;
  const others = CATEGORIES.filter((c) => c.slug !== slug);
  const filtered = applyFilters(products, filters);

  return (
    <>
      {/* HERO */}
      <section className="relative grid lg:grid-cols-2 min-h-[60vh] pt-16 lg:pt-20">
        <div className="flex items-center px-5 lg:px-12 py-16 order-2 lg:order-1">
          <div>
            <p className="font-mono-tag text-[11px] uppercase text-[var(--fuchsia-pop)]">
              {cat.no} — {cat.sub}
            </p>
            <h1 className="mt-5 font-display text-6xl lg:text-8xl text-foreground">
              {cat.name}
            </h1>
            <p className="mt-6 max-w-md text-base lg:text-lg text-muted-foreground leading-relaxed">
              {intro}
            </p>
            <a
              href={SITE.zalo}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-3 px-7 py-4 bg-foreground text-background font-mono-tag text-[12px] uppercase hover:bg-[var(--fuchsia-pop)] transition-colors"
            >
              Tư vấn ngay <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
        <div className="order-1 lg:order-2 bg-foreground overflow-hidden relative">
          <img
            src={heroImage}
            alt={cat.name}
            className="size-full object-cover h-[50vh] lg:h-full"
          />
          <div className="absolute inset-4 lg:inset-6 border border-[var(--fuchsia-pop)] pointer-events-none" />
        </div>
      </section>

      {/* FILTER */}
      <ProductFilters
        value={filters}
        onChange={onFiltersChange}
        total={products.length}
        shown={filtered.length}
      />

      {/* PRODUCTS */}
      <section className="px-5 lg:px-10 py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px]">
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-serif italic text-3xl">Không có outfit nào khớp.</p>
              <p className="mt-3 text-muted-foreground">
                Thử bỏ bớt filter hoặc xem bộ sưu tập khác nhé.
              </p>
              <button
                onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                className="mt-6 px-6 py-3 bg-foreground text-background font-mono-tag text-[11px] uppercase"
              >
                Xoá tất cả filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-8">
              {filtered.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 0.05}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* OTHER COLLECTIONS */}
      <section className="px-5 lg:px-10 py-16 lg:py-24 bg-secondary/40">
        <div className="mx-auto max-w-[1400px]">
          <p className="font-mono-tag text-[11px] uppercase text-[var(--fuchsia-pop)] text-center">
            Tiếp tục khám phá
          </p>
          <h2 className="mt-3 font-display text-3xl lg:text-5xl text-center">Bộ sưu tập khác</h2>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {others.map((c) => (
              <Link key={c.slug} to={`/${c.slug}`} className="group text-center">
                <div className="aspect-square bg-background flex items-center justify-center font-display text-3xl lg:text-5xl group-hover:bg-foreground group-hover:text-background transition-colors border border-foreground/10">
                  {c.no}
                </div>
                <p className="mt-3 font-serif text-lg lg:text-xl">{c.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
