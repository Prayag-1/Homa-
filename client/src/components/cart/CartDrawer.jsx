import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import QuantitySelector from '../product/QuantitySelector';
import { formatPrice } from '../../utils/formatPrice';
import { getResponsiveImageProps } from '../../utils/cloudinaryUrl';

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
            className="fixed right-0 top-0 z-[80] flex h-full w-full flex-col bg-white shadow-[-4px_0_32px_rgba(0,0,0,0.1)] sm:w-[420px]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
            aria-label="Cart drawer"
          >
            <header className="flex items-center justify-between bg-homa-red px-6 py-5">
              <div className="flex items-center gap-3">
                <h2 className="font-body text-[13px] font-bold uppercase tracking-[0.16em] text-white">
                  Your Cart
                </h2>
                <span className="rounded-pill bg-white px-2.5 py-1 font-body text-xs font-bold text-homa-red">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="touch-target text-white transition-opacity hover:opacity-70"
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-homa-blush">
                  <ShoppingBag size={40} className="text-homa-red" />
                </div>
                <h3 className="font-heading text-xl text-homa-black">Your cart is empty</h3>
                <p className="mt-2 max-w-xs font-body text-sm text-homa-grey">
                  Add products to your cart before checking out.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/shop');
                  }}
                  className="mt-6 rounded-pill bg-homa-red px-6 py-3 font-body text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-homa-red-dark"
                >
                  Shop Now
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto">
                  <div>
                    {items.map((item) => {
                      const id = item._id || item.id;
                      const image = item.images?.[0]?.url || item.image || '/placeholder.jpg';
                      const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);

                      return (
                        <div key={id} className="flex gap-3 border-b border-[#F0E8E8] px-4 py-4 sm:gap-4 sm:px-6">
                          <Link to={`/products/${id}`} onClick={onClose} className="h-[60px] w-[60px] flex-shrink-0 overflow-hidden rounded-lg bg-homa-blush">
                            <img {...getResponsiveImageProps(image, item.name, '60px')} className="h-full w-full object-cover" />
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-body text-[11px] font-bold uppercase tracking-[0.1em] text-homa-red">
                                  {item.brand}
                                </p>
                                <Link
                                  to={`/products/${id}`}
                                  onClick={onClose}
                                  className="font-heading text-sm leading-snug text-homa-black hover:text-homa-red"
                                >
                                  {item.name}
                                </Link>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(id)}
                                className="touch-target -mr-2 -mt-2 text-homa-grey transition hover:text-homa-red"
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
                              <p className="font-body text-sm font-semibold text-homa-black">
                                {formatPrice(itemTotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <footer
                  className="sticky bottom-0 bg-white px-6 py-5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:bg-homa-blush sm:shadow-none"
                  style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
                >
                  <div className="space-y-2 font-body text-[13px]">
                    <div className="flex justify-between text-homa-grey">
                      <span>Subtotal</span>
                      <span className="text-homa-black">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-homa-grey">
                      <span>VAT (13%)</span>
                      <span className="text-homa-black">{formatPrice(vatAmount)}</span>
                    </div>
                    <p className="font-body text-[11px] italic text-homa-grey">VAT is calculated at 13%.</p>
                    <div className="flex justify-between pt-2 font-body text-lg font-bold text-homa-black">
                      <span>Total</span>
                      <span>{formatPrice(grandTotal)}</span>
                    </div>
                  </div>

                  <Link
                    to="/checkout"
                    onClick={onClose}
                    className="touch-target mt-5 w-full rounded-pill bg-homa-red py-4 text-center font-body text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-homa-red-dark"
                  >
                    Proceed to Checkout
                  </Link>
                  <Link
                    to="/shop"
                    onClick={onClose}
                    className="mt-4 block text-center font-body text-sm text-homa-grey hover:text-homa-red"
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
