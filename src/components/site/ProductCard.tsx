import { SITE, formatVND, type Product as FullProduct } from "@/lib/site";
import { Link } from "@tanstack/react-router";

export type Product = {
  name: string;
  price: string;
  oldPrice?: string;
  badge?: string;
  image: string;
};

type Props = { product: Product | FullProduct };

function isFull(p: Product | FullProduct): p is FullProduct {
  return typeof (p as FullProduct).price === "number";
}

export function ProductCard({ product }: Props) {
  const name = product.name;
  const image = product.image;
  const badge = product.badge;
  const price = isFull(product) ? formatVND(product.price) : product.price;
  const oldPrice = isFull(product)
    ? product.oldPrice != null
      ? formatVND(product.oldPrice)
      : undefined
    : product.oldPrice;

  const id = isFull(product) ? product.id : undefined;

  return (
    <article className="group">
      <div className="relative overflow-hidden bg-muted aspect-[3/4] border border-foreground/10">
        {id ? (
          <Link to="/san-pham/$id" params={{ id }} className="absolute inset-0 z-10" aria-label={name} />
        ) : null}
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-all duration-700 group-hover:scale-105"
        />
        {badge && (
          <span className="absolute top-3 left-3 z-20 px-3 py-1 font-mono-tag text-[10px] uppercase bg-foreground text-background">
            {badge}
          </span>
        )}
        <a
          href={SITE.zalo}
          target="_blank"
          rel="noreferrer"
          className="absolute z-20 bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-[var(--fuchsia-pop)] text-background py-3 text-center font-mono-tag text-[11px] uppercase"
        >
          Đặt qua Zalo →
        </a>
      </div>
      <div className="pt-4 flex items-start justify-between gap-3">
        <div>
          {id ? (
            <Link to="/san-pham/$id" params={{ id }}>
              <h3 className="font-serif text-xl leading-tight hover:text-[var(--fuchsia-pop)] transition-colors">{name}</h3>
            </Link>
          ) : (
            <h3 className="font-serif text-xl leading-tight">{name}</h3>
          )}
          <div className="mt-1 flex items-baseline gap-2 text-sm">
            <span className="font-mono-tag font-medium text-foreground">{price}</span>
            {oldPrice && (
              <span className="text-muted-foreground line-through text-xs">{oldPrice}</span>
            )}
          </div>
        </div>
        {id ? (
          <Link
            to="/san-pham/$id"
            params={{ id }}
            className="hidden lg:inline font-mono-tag text-[10px] uppercase text-muted-foreground hover:text-[var(--fuchsia-pop)] mt-1.5"
          >
            Xem →
          </Link>
        ) : null}
      </div>
    </article>
  );
}
