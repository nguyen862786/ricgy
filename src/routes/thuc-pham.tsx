import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { CategoryPage } from "@/components/site/CategoryPage";
import { PRODUCTS } from "@/lib/site";
import cat from "@/assets/p2.jpg";
import { DEFAULT_FILTERS, type FilterValue } from "@/components/site/ProductFilters";

const filterSchema = z.object({
  tag: fallback(z.enum(["all", "new", "hot", "sale"]), "all").default("all"),
  colors: fallback(z.array(z.enum(["ink","fuchsia","teal","cream","cocoa","pastel","natural","gold","rose"])), []).default([]),
  fits: fallback(z.array(z.enum(["om","suong","xoe","crop","oversized","duong-da","trang-diem","dinh-duong","thuc-duong"])), []).default([]),
  sizes: fallback(z.array(z.enum(["S","M","L","XL","30ml","50ml","100ml","150g","250g","500g","1kg"])), []).default([]),
  sort: fallback(z.enum(["newest","price-asc","price-desc"]), "newest").default("newest"),
});

export const Route = createFileRoute("/thuc-pham")({
  validateSearch: zodValidator(filterSchema),
  head: () => ({
    meta: [
      { title: "Thực phẩm sạch — RICGY" },
      { name: "description", content: "Thực phẩm dinh dưỡng xanh organic từ RICGY — Trà thực dưỡng, Granola hạt dinh dưỡng siêu dưỡng chất." },
      { property: "og:title", content: "Thực phẩm sạch — RICGY" },
      { property: "og:description", content: "Dinh dưỡng lành mạnh cho cuộc sống khỏe." },
      { property: "og:image", content: cat },
    ],
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch() as FilterValue;
  const navigate = useNavigate({ from: "/thuc-pham" });
  return (
    <CategoryPage
      slug="thuc-pham"
      heroImage={cat}
      products={PRODUCTS["thuc-pham"]}
      intro="Dinh dưỡng xanh từ RICGY — Cung cấp năng lượng sạch thuần khiết, đồng hành cùng vóc dáng khỏe mạnh lý tưởng của bạn."
      filters={search}
      onFiltersChange={(v) => navigate({ search: v as Record<string, unknown>, replace: true })}
    />
  );
}

export { DEFAULT_FILTERS };
