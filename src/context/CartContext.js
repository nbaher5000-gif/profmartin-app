import React, { createContext, useContext, useState, useMemo } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [concern, setConcern] = useState(null);
  const [orders, setOrders] = useState([
    { id: "1045", status: "در حال ارسال", date: "۴ مرداد" },
    { id: "1038", status: "تحویل شده", date: "۲۲ تیر" },
  ]);

  const addToCart = (product, size) => {
    const key = `${product.id}-${size}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        { key, id: product.id, name: product.name, price: product.price, size, qty: 1, color: product.color },
      ];
    });
  };

  const changeQty = (key, delta) => {
    setCart((prev) =>
      prev.map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );
  };

  // بعد از ثبت موفق سفارش واقعی روی مارتین‌بات صدا زده می‌شود
  const recordOrder = ({ localOrderId, wcOrderId }) => {
    const newOrder = {
      id: wcOrderId ? String(wcOrderId) : `L${localOrderId}`,
      status: wcOrderId ? "ثبت شد" : "در حال پردازش",
      date: "امروز",
    };
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
  };

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.qty * i.price, 0), [cart]);

  return (
    <CartContext.Provider
      value={{ cart, cartCount, cartTotal, addToCart, changeQty, recordOrder, orders, concern, setConcern }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart باید داخل CartProvider استفاده شود");
  return ctx;
}
