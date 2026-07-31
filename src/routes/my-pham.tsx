import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { CategoryPage } from "@/components/site/CategoryPage";
import { PRODUCTS } from "@/lib/site";
import cat from "@/assets/p1.jpg";
import { DEFAULT_FILTERS, type FilterValue } from "@/components/site/ProductFilters";

const filterSchema = z.object({
  tag: fallback(z.enum(["all", "new", "hot", "sale"]), "all").default("all"),
  colors: fallback(z.array(z.enum(["ink","fuchsia","teal","cream","cocoa","pastel","natural","gold","rose"])), []).default([]),
  fits: fallback(z.array(z.enum(["om","suong","xoe","crop","oversized","duong-da","trang-diem","dinh-duong","thuc-duong"])), []).default([]),
  sizes: fallback(z.array(z.enum(["S","M","L","XL","30ml","50ml","100ml","150g","250g","500g","1kg"])), []).default([]),
  sort: fallback(z.enum(["newest","price-asc","price-desc"]), "newest").default("newest"),
});

export const Route = createFileRoute("/my-pham")({
  validateSearch: zodValidator(filterSchema),
  head: () => ({
    meta: [
      { title: "Mỹ phẩm — RICGY" },
      { name: "description", content: "Mỹ phẩm tự nhiên cao cấp từ RICGY — bảo vệ, tái tạo và nâng niu vẻ đẹp thuần khiết." },
      { property: "og:title", content: "Mỹ phẩm — RICGY" },
      { property: "og:description", content: "Chăm sóc da tự nhiên và an lành." },
      { property: "og:image", content: cat },
    ],
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch() as FilterValue;
  const navigate = useNavigate({ from: "/my-pham" });
  return (
    <CategoryPage
      slug="my-pham"
      heroImage={cat}
      products={PRODUCTS["my-pham"]}
      intro="Mỹ phẩm RICGY — chiết xuất thiên nhiên thảo mộc, giúp làn da bạn luôn rạng rỡ và tràn đầy sức sống mỗi ngày."
      filters={search}
      onFiltersChange={(v) => navigate({ search: v as Record<string, unknown>, replace: true })}
    />
  );
}

export { DEFAULT_FILTERS };
