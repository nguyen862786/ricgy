import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/hooks/useCart";
import { formatVND, SITE, COLOR_META } from "@/lib/site";
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/gio-hang")({
  component: ShoppingCartTab,
});

function ShoppingCartTab() {
  const { items, updateQuantity, removeFromCart, totalPrice, cartCount } = useCart();

  const handleCheckout = () => {
    if (items.length === 0) return;

    let text = "Em chào RICGY, em muốn đặt hàng các sản phẩm:\n";
    items.forEach((item, idx) => {
      const colorLabel = COLOR_META[item.color]?.label || item.color;
      const sizeLabel = item.size ? ` - size ${item.size}` : "";
      text += `${idx + 1}. ${item.product.name} (Màu: ${colorLabel}${sizeLabel}, Số lượng: ${item.quantity})\n`;
    });
    text += `\nTạm tính: ${formatVND(totalPrice)}\nEm xin cảm ơn ạ!`;

    const encodedText = encodeURIComponent(text);
    const link = `${SITE.zalo}?text=${encodedText}`;
    window.open(link, "_blank");
  };

  return (
    <div className="px-4 pb-12 space-y-6">
      {/* Page Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Giỏ hàng của bạn</h1>
          <p className="text-xs text-muted-foreground">Có {cartCount} sản phẩm trong giỏ</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl space-y-4">
          <div className="size-16 rounded-full bg-secondary/60 flex items-center justify-center mx-auto text-muted-foreground">
            <ShoppingBag className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold">Giỏ hàng đang trống</h3>
            <p className="text-xs text-muted-foreground px-6">
              Bạn chưa thêm sản phẩm nào. Hãy khám phá và chọn cho mình sản phẩm ưng ý nhé.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-xs font-semibold rounded-full hover:bg-[var(--fuchsia-pop)] hover:text-white transition"
          >
            Mua sắm ngay <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Cart items list */}
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={`${item.product.id}-${item.size}-${item.color}-${idx}`}
                className="bg-card border border-border rounded-2xl p-3 flex gap-3 shadow-xs"
              >
                {/* Product Image */}
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="size-20 rounded-xl object-cover bg-muted shrink-0"
                />

                {/* Product info & controllers */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">
                      {item.product.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground pt-0.5 font-semibold">
                      Màu: {COLOR_META[item.color]?.label || item.color}
                      {item.size && ` · Size: ${item.size}`}
                    </p>
                  </div>

                  {/* Quantity & Price bar */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Controls */}
                    <div className="flex items-center gap-1 bg-secondary/40 border border-border/60 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                        className="p-1 hover:bg-background rounded transition cursor-pointer"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                        className="p-1 hover:bg-background rounded transition cursor-pointer"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <span className="text-xs font-bold text-foreground">
                      {formatVND(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromCart(idx)}
                  className="p-1 text-muted-foreground hover:text-destructive transition self-start cursor-pointer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
              <span>Tạm tính</span>
              <span className="text-foreground">{formatVND(totalPrice)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
              <span>Phí vận chuyển</span>
              <span className="text-emerald-600 font-bold">Miễn phí</span>
            </div>
            <div className="h-px bg-border my-1" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">Tổng cộng</span>
              <span className="text-base font-bold text-[var(--fuchsia-pop)]">
                {formatVND(totalPrice)}
              </span>
            </div>
          </div>

          {/* Checkout CTA */}
          <button
            onClick={handleCheckout}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--fuchsia-pop)] text-white font-semibold rounded-2xl hover:bg-foreground transition shadow-md cursor-pointer"
          >
            <MessageCircle className="size-5" />
            <span>Gửi đơn qua Zalo nhận ưu đãi</span>
          </button>
        </div>
      )}
    </div>
  );
}
