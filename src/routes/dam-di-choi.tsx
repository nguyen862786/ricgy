import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { CategoryPage } from "@/components/site/CategoryPage";
import { PRODUCTS } from "@/lib/site";
import cat from "@/assets/cat-party.jpg";
import { type FilterValue } from "@/components/site/ProductFilters";

const filterSchema = z.object({
  tag: fallback(z.enum(["all", "new", "hot", "sale"]), "all").default("all"),
  colors: fallback(z.array(z.enum(["ink","fuchsia","teal","cream","cocoa","pastel"])), []).default([]),
  fits: fallback(z.array(z.enum(["om","suong","xoe","crop","oversized"])), []).default([]),
  sizes: fallback(z.array(z.enum(["S","M","L","XL"])), []).default([]),
  sort: fallback(z.enum(["newest","price-asc","price-desc"]), "newest").default("newest"),
});

export const Route = createFileRoute("/dam-di-choi")({
  validateSearch: zodValidator(filterSchema),
  head: () => ({
    meta: [
      { title: "BST Đầm đi chơi — RICGY" },
      { name: "description", content: "Đầm đi chơi & dạ tiệc — bold silhouettes, lung linh trong mọi cuộc hẹn." },
      { property: "og:title", content: "BST Đầm đi chơi — RICGY" },
      { property: "og:image", content: cat },
    ],
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch() as FilterValue;
  const navigate = useNavigate({ from: "/dam-di-choi" });
  return (
    <CategoryPage
      slug="dam-di-choi"
      heroImage={cat}
      products={PRODUCTS["dam-di-choi"]}
      intro="Lung linh trong mọi cuộc hẹn — từ brunch sáng tới party đêm."
      filters={search}
      onFiltersChange={(v) => navigate({ search: v as Record<string, unknown>, replace: true })}
    />
  );
}
