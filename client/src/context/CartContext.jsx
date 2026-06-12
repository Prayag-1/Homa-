import { createContext, useState, useEffect, useContext } from 'react';

export const CartContext = createContext();

const VAT_RATE = 0.13;
const getProductId = (product) => product?._id || product?.id;

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem('homa_cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('homa_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, qty) => {
    const productId = getProductId(product);
    if (!productId) return;

    setItems(prev => {
      const existing = prev.find(i => getProductId(i) === productId);
      if (existing) {
        return prev.map(i => getProductId(i) === productId ? { ...i, quantity: i.quantity + qty } : i);
      }
      // NOTE: Cart prices are display-only. The backend recalculates
      // all prices from the database when the order is created.
      // Never trust frontend prices for payment amounts.
      return [...prev, { ...product, id: productId, quantity: qty }];
    });

    window.dispatchEvent(new Event('homa:open-cart'));
  };

  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => getProductId(i) !== productId));
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) {
      removeItem(productId);
    } else {
      setItems(prev => prev.map(i => getProductId(i) === productId ? { ...i, quantity: qty } : i));
    }
  };

  const clearCart = () => setItems([]);

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
