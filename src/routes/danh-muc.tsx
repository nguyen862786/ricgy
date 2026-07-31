import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, PRODUCTS } from "@/lib/site";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/danh-muc")({
  component: ExploreCategories,
});

function ExploreCategories() {
  const getProductCount = (slug: string) => {
    return PRODUCTS[slug]?.length || 0;
  };

  return (
    <div className="px-4 pb-12 space-y-6">
      {/* Page Header */}
      <div className="pt-2">
        <h1 className="font-serif text-2xl font-bold">Khám phá danh mục</h1>
        <p className="text-xs text-muted-foreground">Tìm kiếm theo ngành hàng yêu thích của bạn</p>
      </div>

      {/* Category List */}
      <div className="space-y-4">
        {CATEGORIES.map((cat, idx) => (
          <Link
            key={cat.slug}
            to={`/${cat.slug}` as any}
            className="group flex items-center gap-4 bg-card p-4 rounded-2xl border border-border hover:border-primary transition shadow-xs"
          >
            {/* Visual Icon/Number */}
            <div className="size-12 rounded-xl bg-secondary/60 flex items-center justify-center font-serif text-lg font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              {cat.no}
            </div>

            {/* Content info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-lg font-bold text-foreground truncate">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-muted-foreground uppercase font-mono font-semibold">
                  {cat.sub}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate pt-0.5">
                {cat.desc}
              </p>
              <span className="inline-block text-[10px] bg-secondary/40 text-primary-foreground/90 font-medium px-2 py-0.5 rounded-full mt-1.5 font-semibold">
                {getProductCount(cat.slug)} sản phẩm
              </span>
            </div>

            {/* Arrow */}
            <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition" />
          </Link>
        ))}
      </div>

      {/* Brand values banner */}
      <div className="border border-dashed border-border p-5 rounded-2xl bg-secondary/10 space-y-3 text-center">
        <h4 className="font-serif text-base font-bold text-foreground">
          Cam kết chất lượng từ RICGY
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          100% sản phẩm thiết kế & gia công tại Việt Nam. Mỹ phẩm tự nhiên an lành, thực phẩm organic tốt cho sức khỏe cả gia đình.
        </p>
      </div>
    </div>
  );
}
