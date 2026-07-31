import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { CategoryPage } from "@/components/site/CategoryPage";
import { PRODUCTS } from "@/lib/site";
import cat from "@/assets/cat-sleep.jpg";
import { type FilterValue } from "@/components/site/ProductFilters";

const filterSchema = z.object({
  tag: fallback(z.enum(["all", "new", "hot", "sale"]), "all").default("all"),
  colors: fallback(z.array(z.enum(["ink","fuchsia","teal","cream","cocoa","pastel"])), []).default([]),
  fits: fallback(z.array(z.enum(["om","suong","xoe","crop","oversized"])), []).default([]),
  sizes: fallback(z.array(z.enum(["S","M","L","XL"])), []).default([]),
  sort: fallback(z.enum(["newest","price-asc","price-desc"]), "newest").default("newest"),
});

export const Route = createFileRoute("/dam-ngu")({
  validateSearch: zodValidator(filterSchema),
  head: () => ({
    meta: [
      { title: "BST Đầm ngủ — RICGY" },
      { name: "description", content: "Sleepwear lụa & cotton — mềm mại, dịu dàng cho giấc ngủ thật êm." },
      { property: "og:title", content: "BST Đầm ngủ — RICGY" },
      { property: "og:image", content: cat },
    ],
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch() as FilterValue;
  const navigate = useNavigate({ from: "/dam-ngu" });
  return (
    <CategoryPage
      slug="dam-ngu"
      heroImage={cat}
      products={PRODUCTS["dam-ngu"]}
      intro="Mềm mại, dịu dàng — sleepwear cho những đêm thật êm."
      filters={search}
      onFiltersChange={(v) => navigate({ search: v as Record<string, unknown>, replace: true })}
    />
  );
}
