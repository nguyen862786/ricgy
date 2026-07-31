import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Product, SizeKey, ColorKey } from "@/lib/site";

export interface CartItem {
  product: Product;
  quantity: number;
  size: SizeKey | null;
  color: ColorKey;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, size: SizeKey | null, color: ColorKey) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, q: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ricgy_cart");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    }
  }, []);

  // Save cart to localStorage on changes
  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem("ricgy_cart", JSON.stringify(newItems));
    } catch (e) {
      console.error("Failed to save cart", e);
    }
  };

  const addToCart = (product: Product, quantity: number, size: SizeKey | null, color: ColorKey) => {
    const existingIndex = items.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.size === size &&
        item.color === color
    );

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += quantity;
      saveCart(updated);
    } else {
      saveCart([...items, { product, quantity, size, color }]);
    }
  };

  const removeFromCart = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    saveCart(updated);
  };

  const updateQuantity = (index: number, q: number) => {
    if (q <= 0) {
      removeFromCart(index);
      return;
    }
    const updated = [...items];
    updated[index].quantity = q;
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
