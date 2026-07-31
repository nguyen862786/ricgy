import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { CategoryPage } from "@/components/site/CategoryPage";
import { PRODUCTS } from "@/lib/site";
import cat from "@/assets/cat-office.jpg";
import { DEFAULT_FILTERS, type FilterValue } from "@/components/site/ProductFilters";

const filterSchema = z.object({
  tag: fallback(z.enum(["all", "new", "hot", "sale"]), "all").default("all"),
  colors: fallback(z.array(z.enum(["ink","fuchsia","teal","cream","cocoa","pastel"])), []).default([]),
  fits: fallback(z.array(z.enum(["om","suong","xoe","crop","oversized"])), []).default([]),
  sizes: fallback(z.array(z.enum(["S","M","L","XL"])), []).default([]),
  sort: fallback(z.enum(["newest","price-asc","price-desc"]), "newest").default("newest"),
});

export const Route = createFileRoute("/cong-so")({
  validateSearch: zodValidator(filterSchema),
  head: () => ({
    meta: [
      { title: "BST Công sở — RICGY" },
      { name: "description", content: "Thời trang công sở nữ thanh lịch, hiện đại từ RICGY — blazer, áo kiểu, đầm sơ mi, set quần tây." },
      { property: "og:title", content: "BST Công sở — RICGY" },
      { property: "og:description", content: "Thanh lịch, tự tin trong từng chuyển động." },
      { property: "og:image", content: cat },
    ],
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch() as FilterValue;
  const navigate = useNavigate({ from: "/cong-so" });
  return (
    <CategoryPage
      slug="cong-so"
      heroImage={cat}
      products={PRODUCTS["cong-so"]}
      intro="Bộ sưu tập công sở RICGY — bold, structured, tự tin từ buổi họp đến cuộc hẹn chiều."
      filters={search}
      onFiltersChange={(v) => navigate({ search: v as Record<string, unknown>, replace: true })}
    />
  );
}

export { DEFAULT_FILTERS };
