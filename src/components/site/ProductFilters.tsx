import { Link } from "@tanstack/react-router";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import {
  COLOR_META,
  FIT_META,
  type ColorKey,
  type FitKey,
  type SizeKey,
  type SortKey,
  type TagKey,
} from "@/lib/site";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type FilterValue = {
  tag: TagKey;
  colors: ColorKey[];
  fits: FitKey[];
  sizes: SizeKey[];
  sort: SortKey;
};

export const DEFAULT_FILTERS: FilterValue = {
  tag: "all",
  colors: [],
  fits: [],
  sizes: [],
  sort: "newest",
};

const TAGS: { key: TagKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Mới về" },
  { key: "hot", label: "Bán chạy" },
  { key: "sale", label: "Sale" },
];

const SIZES: SizeKey[] = ["S", "M", "L", "XL", "30ml", "50ml", "100ml", "150g", "250g", "500g", "1kg"];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Mới nhất" },
  { key: "price-asc", label: "Giá thấp → cao" },
  { key: "price-desc", label: "Giá cao → thấp" },
];

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function activeCount(v: FilterValue) {
  return (
    (v.tag !== "all" ? 1 : 0) +
    v.colors.length +
    v.fits.length +
    v.sizes.length +
    (v.sort !== "newest" ? 1 : 0)
  );
}

function FilterBody({
  value,
  onChange,
  total,
  shown,
}: {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  total: number;
  shown: number;
}) {
  return (
    <div className="space-y-8">
      {/* Tag */}
      <div>
        <h4 className="font-mono-tag text-[11px] uppercase text-muted-foreground mb-3">Loại</h4>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <button
              key={t.key}
              onClick={() => onChange({ ...value, tag: t.key })}
              className={`px-4 py-2 font-mono-tag text-[11px] uppercase border transition-colors ${
                value.tag === t.key
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/30 hover:border-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h4 className="font-mono-tag text-[11px] uppercase text-muted-foreground mb-3">Màu</h4>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(COLOR_META) as ColorKey[]).map((c) => {
            const active = value.colors.includes(c);
            const meta = COLOR_META[c];
            return (
              <button
                key={c}
                onClick={() => onChange({ ...value, colors: toggle(value.colors, c) })}
                title={meta.label}
                className="group flex flex-col items-center gap-1.5"
              >
                <span
                  className={`relative size-8 rounded-full border-2 transition-all ${
                    active ? "border-[var(--fuchsia-pop)] scale-110" : "border-foreground/20"
                  }`}
                  style={{ backgroundColor: meta.hex }}
                >
                  {active && (
                    <Check
                      className="absolute inset-0 m-auto size-4"
                      strokeWidth={3}
                      color={c === "ink" || c === "cocoa" || c === "teal" ? "#fff" : "#0F0F12"}
                    />
                  )}
                </span>
                <span className="font-mono-tag text-[9px] uppercase text-muted-foreground group-hover:text-foreground">
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fit */}
      <div>
        <h4 className="font-mono-tag text-[11px] uppercase text-muted-foreground mb-3">Phom</h4>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FIT_META) as FitKey[]).map((f) => {
            const active = value.fits.includes(f);
            return (
              <button
                key={f}
                onClick={() => onChange({ ...value, fits: toggle(value.fits, f) })}
                className={`px-4 py-2 font-mono-tag text-[11px] uppercase border transition-colors ${
                  active
                    ? "bg-[var(--fuchsia-pop)] text-background border-[var(--fuchsia-pop)]"
                    : "border-foreground/30 hover:border-foreground"
                }`}
              >
                {FIT_META[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size */}
      <div>
        <h4 className="font-mono-tag text-[11px] uppercase text-muted-foreground mb-3">Size</h4>
        <div className="flex gap-2">
          {SIZES.map((s) => {
            const active = value.sizes.includes(s);
            return (
              <button
                key={s}
                onClick={() => onChange({ ...value, sizes: toggle(value.sizes, s) })}
                className={`size-10 font-mono-tag text-[12px] border transition-colors ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "border-foreground/30 hover:border-foreground"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <Link
          to="/huong-dan-size"
          className="mt-3 inline-block font-mono-tag text-[10px] uppercase text-[var(--fuchsia-pop)] hover:underline"
        >
          Chưa biết size? →
        </Link>
      </div>

      {/* Sort */}
      <div>
        <h4 className="font-mono-tag text-[11px] uppercase text-muted-foreground mb-3">Sắp xếp</h4>
        <select
          value={value.sort}
          onChange={(e) => onChange({ ...value, sort: e.target.value as SortKey })}
          className="w-full bg-transparent border border-foreground/30 px-3 py-2 font-mono-tag text-[12px] uppercase focus:border-foreground outline-none"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-4 border-t border-foreground/15 flex items-center justify-between">
        <span className="font-mono-tag text-[11px] uppercase text-muted-foreground">
          Hiển thị {shown}/{total}
        </span>
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="font-mono-tag text-[11px] uppercase underline hover:text-[var(--fuchsia-pop)]"
        >
          Xoá lọc
        </button>
      </div>
    </div>
  );
}

export function ProductFilters({
  value,
  onChange,
  total,
  shown,
}: {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  total: number;
  shown: number;
}) {
  const [open, setOpen] = useState(false);
  const count = activeCount(value);

  return (
    <section className="px-5 lg:px-10 py-6 border-y border-foreground/15 bg-background sticky top-16 lg:top-20 z-30 backdrop-blur">
      <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-4">
        {/* Mobile: trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="lg:hidden inline-flex items-center gap-2 px-4 py-2 border border-foreground font-mono-tag text-[11px] uppercase">
              <SlidersHorizontal className="size-3.5" />
              Lọc
              {count > 0 && (
                <span className="bg-[var(--fuchsia-pop)] text-background size-5 grid place-items-center text-[10px]">
                  {count}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-serif text-2xl">Lọc sản phẩm</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterBody value={value} onChange={onChange} total={total} shown={shown} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile counter */}
        <span className="lg:hidden font-mono-tag text-[11px] uppercase text-muted-foreground">
          {shown}/{total}
        </span>

        {/* Desktop: inline compact */}
        <div className="hidden lg:flex items-center gap-6 flex-wrap flex-1">
          <span className="font-mono-tag text-[11px] uppercase text-muted-foreground">
            Lọc:
          </span>
          {TAGS.map((t) => (
            <button
              key={t.key}
              onClick={() => onChange({ ...value, tag: t.key })}
              className={`font-mono-tag text-[11px] uppercase pb-1 border-b-2 transition-colors ${
                value.tag === t.key
                  ? "border-[var(--fuchsia-pop)] text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}

          <span className="w-px h-5 bg-foreground/20" />

          {/* color swatches inline */}
          <div className="flex items-center gap-2">
            {(Object.keys(COLOR_META) as ColorKey[]).map((c) => {
              const active = value.colors.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => onChange({ ...value, colors: toggle(value.colors, c) })}
                  title={COLOR_META[c].label}
                  className={`size-6 rounded-full border-2 transition-all ${
                    active ? "border-[var(--fuchsia-pop)] scale-110" : "border-foreground/20 hover:border-foreground"
                  }`}
                  style={{ backgroundColor: COLOR_META[c].hex }}
                  aria-label={COLOR_META[c].label}
                />
              );
            })}
          </div>

          <span className="w-px h-5 bg-foreground/20" />

          {/* fit dropdown-like inline */}
          {(Object.keys(FIT_META) as FitKey[]).map((f) => {
            const active = value.fits.includes(f);
            return (
              <button
                key={f}
                onClick={() => onChange({ ...value, fits: toggle(value.fits, f) })}
                className={`font-mono-tag text-[11px] uppercase pb-1 border-b-2 transition-colors ${
                  active
                    ? "border-[var(--fuchsia-pop)] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {FIT_META[f]}
              </button>
            );
          })}

          <span className="w-px h-5 bg-foreground/20" />

          {SIZES.map((s) => {
            const active = value.sizes.includes(s);
            return (
              <button
                key={s}
                onClick={() => onChange({ ...value, sizes: toggle(value.sizes, s) })}
                className={`size-7 font-mono-tag text-[11px] border transition-colors ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "border-foreground/30 hover:border-foreground"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <select
            value={value.sort}
            onChange={(e) => onChange({ ...value, sort: e.target.value as SortKey })}
            className="bg-transparent border border-foreground/30 px-3 py-1.5 font-mono-tag text-[11px] uppercase focus:border-foreground outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="font-mono-tag text-[11px] uppercase text-muted-foreground">
            {shown}/{total}
          </span>
          {count > 0 && (
            <button
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="font-mono-tag text-[11px] uppercase text-[var(--fuchsia-pop)] hover:underline inline-flex items-center gap-1"
            >
              <X className="size-3" /> Xoá lọc
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// helpers exported for routes to apply filtering
export function applyFilters<P extends import("@/lib/site").Product>(
  products: P[],
  v: FilterValue,
): P[] {
  let out = products.filter((p) => {
    if (v.tag !== "all" && !p.tag.includes(v.tag as Exclude<TagKey, "all">)) return false;
    if (v.colors.length && !v.colors.some((c) => p.colors.includes(c))) return false;
    if (v.fits.length && !v.fits.includes(p.fit)) return false;
    if (v.sizes.length && !v.sizes.some((s) => p.sizes.includes(s))) return false;
    return true;
  });
  if (v.sort === "price-asc") out = [...out].sort((a, b) => a.price - b.price);
  else if (v.sort === "price-desc") out = [...out].sort((a, b) => b.price - a.price);
  else out = [...out].sort((a, b) => b.createdAt - a.createdAt);
  return out;
}
