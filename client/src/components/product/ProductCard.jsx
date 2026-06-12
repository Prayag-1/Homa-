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
      <div className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
        {/* Image Area - 65% */}
        <div
          className="relative w-full overflow-hidden bg-gray-100"
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
            className="w-full h-full object-cover transition-transform duration-400 ease-out"
            style={{
              transform: hoverImage && !outOfStock ? 'scale(1.06)' : 'scale(1)',
            }}
          />

          {/* Wishlist Heart */}
          <motion.button
            type="button"
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 z-10 p-2 bg-white shadow-sm hover:shadow-md transition-all"
            whileTap={{ scale: 1.3 }}
            transition={{ type: 'tween', duration: 0.2 }}
          >
            <Heart
              size={20}
              className={inWishlist ? 'fill-red-600 text-red-600' : 'text-gray-400'}
            />
          </motion.button>

          {/* Out of Stock Overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-body text-sm font-medium">
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
              className="absolute bottom-0 left-0 right-0 bg-black text-white py-3 font-body font-medium text-sm hover:bg-gray-900 transition-colors"
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
              className="absolute bottom-0 left-0 right-0 bg-black text-white py-3 font-body font-medium text-sm hover:bg-gray-900 transition-colors"
            >
              Remove from Wishlist
            </motion.button>
          )}
        </div>

        {/* Content Area - 35% */}
        <div className="p-4">
          {/* Brand */}
          <p className="text-xs font-body font-semibold tracking-widest uppercase text-red-600 mb-1">
            {product.brand}
          </p>

          {/* Product Name */}
          <h3 className="font-display text-lg leading-snug text-black mb-3 line-clamp-2">
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
            <span className="font-body font-bold text-black">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && (
              <span className="font-body text-xs text-gray-500 line-through">
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
                  className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-body rounded-full"
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
