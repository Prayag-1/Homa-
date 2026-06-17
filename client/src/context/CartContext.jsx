import { createContext, useState, useEffect, useContext, useCallback } from 'react';

export const CartContext = createContext();

const VAT_RATE = 0.13;
const getProductId = (product) => product?._id || product?.id;
const normalizeQuantity = (qty) => {
  const parsed = parseInt(qty, 10);
  if (!Number.isInteger(parsed)) return null;
  return Math.max(1, Math.min(parsed, 99));
};

const toCartItem = (product, qty) => {
  const productId = getProductId(product);
  const price = Number(product?.price);
  const quantity = normalizeQuantity(qty);
  if (!productId || !Number.isFinite(price) || price <= 0 || !quantity) {
    return null;
  }

  return {
    id: productId,
    _id: productId,
    name: String(product.name || ''),
    image: product.images?.[0]?.url || product.image || '',
    price,
    quantity,
  };
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('homa_cart');
      const parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => toCartItem(item, item.quantity))
        .filter(Boolean);
    } catch {
      localStorage.removeItem('homa_cart');
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('homa_cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, qty) => {
    const cartItem = toCartItem(product, qty);
    if (!cartItem) return;

    setItems(prev => {
      const existing = prev.find(i => getProductId(i) === cartItem.id);
      if (existing) {
        return prev.map((i) => {
          if (getProductId(i) !== cartItem.id) return i;
          return { ...i, quantity: Math.min(i.quantity + cartItem.quantity, 99) };
        });
      }
      return [...prev, cartItem];
    });

    window.dispatchEvent(new Event('homa:open-cart'));
  }, []);

  const removeItem = useCallback((productId) => {
    setItems(prev => prev.filter(i => getProductId(i) !== productId));
  }, []);

  const updateQty = useCallback((productId, qty) => {
    const nextQty = normalizeQuantity(qty);
    if (!nextQty) {
      setItems(prev => prev.filter(i => getProductId(i) !== productId));
    } else {
      setItems(prev => prev.map(i => getProductId(i) === productId ? { ...i, quantity: nextQty } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vatAmount = parseFloat((subtotal * VAT_RATE).toFixed(2));
  const grandTotal = parseFloat((subtotal + vatAmount).toFixed(2));

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, itemCount, subtotal, vatAmount, grandTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
