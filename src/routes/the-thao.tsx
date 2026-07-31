import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { CategoryPage } from "@/components/site/CategoryPage";
import { PRODUCTS } from "@/lib/site";
import cat from "@/assets/cat-sport.jpg";
import { type FilterValue } from "@/components/site/ProductFilters";

const filterSchema = z.object({
  tag: fallback(z.enum(["all", "new", "hot", "sale"]), "all").default("all"),
  colors: fallback(z.array(z.enum(["ink","fuchsia","teal","cream","cocoa","pastel"])), []).default([]),
  fits: fallback(z.array(z.enum(["om","suong","xoe","crop","oversized"])), []).default([]),
  sizes: fallback(z.array(z.enum(["S","M","L","XL"])), []).default([]),
  sort: fallback(z.enum(["newest","price-asc","price-desc"]), "newest").default("newest"),
});

export const Route = createFileRoute("/the-thao")({
  validateSearch: zodValidator(filterSchema),
  head: () => ({
    meta: [
      { title: "BST Thể thao — RICGY" },
      { name: "description", content: "Activewear nữ — yoga, tennis, pickleball, gym với phom ôm gọn và năng lượng 2026." },
      { property: "og:title", content: "BST Thể thao — RICGY" },
      { property: "og:image", content: cat },
    ],
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch() as FilterValue;
  const navigate = useNavigate({ from: "/the-thao" });
  return (
    <CategoryPage
      slug="the-thao"
      heroImage={cat}
      products={PRODUCTS["the-thao"]}
      intro="Năng lượng SS/26 — set tập tôn dáng, chất co giãn, sẵn sàng cho mọi sàn đấu của nàng."
      filters={search}
      onFiltersChange={(v) => navigate({ search: v as Record<string, unknown>, replace: true })}
    />
  );
}
