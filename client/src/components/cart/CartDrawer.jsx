import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import QuantitySelector from '../product/QuantitySelector';
import EmptyState from '../common/EmptyState';
import { formatPrice } from '../../utils/formatPrice';

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const {
    items,
    itemCount,
    removeItem,
    updateQty,
    subtotal,
    vatAmount,
    grandTotal,
  } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
            aria-label="Cart drawer"
          >
            <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="font-display text-2xl text-black">
                Your Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 transition-colors"
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState
                  title="Your cart is empty"
                  description="Add products to your cart before checking out."
                  actionLabel="Shop Now"
                  onAction={() => {
                    onClose();
                    navigate('/shop');
                  }}
                />
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <div className="space-y-5">
                    {items.map((item) => {
                      const id = item._id || item.id;
                      const image = item.images?.[0]?.url || item.image || '/placeholder.jpg';
                      const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);

                      return (
                        <div key={id} className="flex gap-4 border-b border-gray-100 pb-5">
                          <Link to={`/products/${id}`} onClick={onClose} className="h-24 w-20 flex-shrink-0 overflow-hidden bg-gray-100">
                            <img
                              src={image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-body text-xs font-semibold uppercase tracking-widest text-red-600">
                                  {item.brand}
                                </p>
                                <Link
                                  to={`/products/${id}`}
                                  onClick={onClose}
                                  className="font-display text-lg leading-snug text-black hover:text-red-600"
                                >
                                  {item.name}
                                </Link>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(id)}
                                className="p-1 text-gray-500 hover:text-black"
                                aria-label={`Remove ${item.name}`}
                              >
                                <X size={18} />
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <QuantitySelector
                                value={item.quantity}
                                min={1}
                                max={item.stock || 99}
                                onChange={(qty) => updateQty(id, qty)}
                              />
                              <p className="font-body text-sm font-bold text-black">
                                {formatPrice(itemTotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <footer className="border-t border-gray-200 px-5 py-5">
                  <div className="space-y-2 font-body text-sm">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>VAT (13%)</span>
                      <span>{formatPrice(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-xl font-bold text-black">
                      <span>Total</span>
                      <span>{formatPrice(grandTotal)}</span>
                    </div>
                  </div>

                  <Link
                    to="/checkout"
                    onClick={onClose}
                    className="mt-5 block w-full bg-black py-3 text-center font-body text-sm font-medium text-white hover:bg-gray-900 transition-colors"
                  >
                    Proceed to Checkout
                  </Link>
                  <Link
                    to="/shop"
                    onClick={onClose}
                    className="mt-4 block text-center font-body text-sm text-gray-700 hover:text-black"
                  >
                    Continue Shopping
                  </Link>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
