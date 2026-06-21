import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';
import { useWishlist } from '../hooks/useWishlist';

export default function Wishlist() {
  const navigate = useNavigate();
  const { products, isLoading, isError } = useWishlist();

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h1 className="text-h1 font-display text-black mb-2">
            Wishlist
          </h1>
          <p className="font-body text-gray-600">
            {products.length} {products.length === 1 ? 'product' : 'products'} saved
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 md:gap-4 md:px-0 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="py-16 text-center">
            <p className="font-body text-gray-600 mb-4">
              Your wishlist could not be loaded. Please try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="touch-target px-6 py-2 bg-black text-white font-body text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <EmptyState
            title="Your wishlist is empty"
            description="Save your favorite products and find them here later."
            actionLabel="Shop Now"
            onAction={() => navigate('/shop')}
          />
        )}

        {!isLoading && !isError && products.length > 0 && (
          <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 md:gap-4 md:px-0 lg:grid-cols-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                showQuickAdd={false}
                showRemoveFromWishlist
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
