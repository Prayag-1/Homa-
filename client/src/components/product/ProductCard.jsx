import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { memo, useContext, useState } from 'react';
import { CartContext } from '../../context/CartContext';
import { useWishlist } from '../../hooks/useWishlist';
import StarRating from './StarRating';
import { formatPrice } from '../../utils/formatPrice';
import { optimizeImage } from '../../utils/cloudinaryUrl';

const ProductCard = ({ product, showQuickAdd = true, showRemoveFromWishlist = false }) => {
  const { addItem } = useContext(CartContext);
  const { isInWishlist, toggle } = useWishlist();
  const [hoverImage, setHoverImage] = useState(false);
  const [showQuickAddBtn, setShowQuickAddBtn] = useState(false);

  const inWishlist = isInWishlist(product._id);
  const outOfStock = product.stock === 0;
  const firstImage = product.images?.[0]?.url;

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product._id);
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!outOfStock && showQuickAdd) {
      addItem(product, 1);
    }
  };

  return (
    <Link
      to={`/products/${product._id}`}
      className="block group text-decoration-none"
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(209,0,0,0.12)]">
        <div
          className="relative w-full overflow-hidden bg-homa-blush"
          style={{ aspectRatio: '3/4' }}
          onMouseEnter={() => {
            setHoverImage(true);
            setShowQuickAddBtn(true);
          }}
          onMouseLeave={() => {
            setHoverImage(false);
            setShowQuickAddBtn(false);
          }}
        >
          {/* Main Image */}
          <img
            src={optimizeImage(firstImage, 600) || '/placeholder.jpg'}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[400ms] ease-out"
            style={{
              transform: hoverImage && !outOfStock ? 'scale(1.06)' : 'scale(1)',
            }}
          />

          {/* Wishlist Heart */}
          <motion.button
            type="button"
            onClick={handleWishlistToggle}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.14)]"
            whileTap={{ scale: 1.3 }}
            transition={{ type: 'tween', duration: 0.2 }}
          >
            <Heart
              size={20}
              className={inWishlist ? 'fill-homa-red text-homa-red' : 'text-homa-grey'}
            />
          </motion.button>

          {/* Out of Stock Overlay */}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-homa-black/60">
              <span className="font-body text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                Out of Stock
              </span>
            </div>
          )}

          {/* Quick Add Button */}
          {showQuickAdd && showQuickAddBtn && !outOfStock && (
            <motion.button
              type="button"
              onClick={handleQuickAdd}
              initial={{ translateY: '100%' }}
              animate={{ translateY: 0 }}
              exit={{ translateY: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute bottom-0 left-0 right-0 bg-homa-red py-3 font-body text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-homa-red-dark"
            >
              Quick Add
            </motion.button>
          )}

          {showRemoveFromWishlist && showQuickAddBtn && (
            <motion.button
              type="button"
              onClick={handleWishlistToggle}
              initial={{ translateY: '100%' }}
              animate={{ translateY: 0 }}
              exit={{ translateY: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute bottom-0 left-0 right-0 bg-homa-red py-3 font-body text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-homa-red-dark"
            >
              Remove from Wishlist
            </motion.button>
          )}
        </div>

        <div className="p-4">
          <p className="mb-1 font-body text-[11px] font-bold uppercase tracking-[0.1em] text-homa-red">
            {product.brand}
          </p>

          <h3 className="mb-3 line-clamp-2 font-heading text-base leading-snug text-homa-black">
            {product.name}
          </h3>

          {/* Star Rating */}
          <div className="mb-3">
            <StarRating
              rating={product.ratings?.average || 0}
              count={product.ratings?.count || 0}
              size="sm"
            />
          </div>

          {/* Price Row */}
          <div className="flex items-center gap-2 mb-3">
            <span className="font-body text-lg font-semibold text-homa-black">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && (
              <span className="font-body text-sm text-homa-grey line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          {/* Skin Type Tags */}
          {product.skinTypes && product.skinTypes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.skinTypes.slice(0, 2).map((type) => (
                <span
                  key={type}
                  className="inline-block rounded-pill bg-homa-blush px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-[0.08em] text-homa-red"
                >
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default memo(ProductCard);
