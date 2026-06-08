import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProduct, useProductReviews, useSubmitReview } from '../hooks/useProducts';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../hooks/useAuth';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import ImageGallery from '../components/product/ImageGallery';
import StarRating from '../components/product/StarRating';
import AuthenticityBadge from '../components/product/AuthenticityBadge';
import QuantitySelector from '../components/product/QuantitySelector';
import AccordionSection from '../components/product/AccordionSection';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/ui/Spinner';
import { formatPrice } from '../utils/formatPrice';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useContext(CartContext);
  const { isInWishlist, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    body: '',
  });
  const [reviewError, setReviewError] = useState('');

  const { data: product, isLoading, isError } = useProduct(id);
  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    isError: reviewsError,
  } = useProductReviews(id);
  const submitReview = useSubmitReview(id);

  const handleAddToCart = async () => {
    addItem(product, qty);
    toast.success('Added to cart');
  };

  const handleSubmitReview = async () => {
    setReviewError('');

    if (reviewForm.rating === 0) {
      setReviewError('Please select a rating');
      return;
    }

    if (reviewForm.body.length < 10) {
      setReviewError('Review must be at least 10 characters');
      return;
    }

    try {
      await submitReview.mutateAsync(reviewForm);
      setReviewForm({ rating: 0, title: '', body: '' });
      setReviewFormOpen(false);
      toast.success('Review submitted and awaiting approval.');
    } catch (error) {
      let message;
      if (error.response?.status === 403) {
        message = 'You can only review products you have purchased and received.';
      } else if (error.response?.status === 400) {
        message = 'You have already reviewed this product.';
      } else {
        message = 'Something went wrong. Please try again.';
      }
      setReviewError(message);
      toast.error(message);
    }
  };

  // SEO
  const metaDescription = product?.description
    ? product.description.substring(0, 155)
    : 'Japanese skincare product from HOMA';

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          title="Product not found"
          description="The product you're looking for doesn't exist or has been removed."
          actionLabel="Back to Shop"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left: Image Skeleton */}
            <div className="bg-gray-200 animate-pulse" style={{ aspectRatio: '1/1' }} />

            {/* Right: Content Skeleton */}
            <div className="space-y-6">
              <div className="h-3 w-20 bg-gray-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-full bg-gray-200 animate-pulse" />
                <div className="h-6 w-2/3 bg-gray-200 animate-pulse" />
              </div>
              <div className="h-4 w-32 bg-gray-200 animate-pulse" />
              <div className="space-y-3">
                <div className="h-6 w-32 bg-gray-200 animate-pulse" />
                <div className="h-4 w-40 bg-gray-200 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          title="Product not found"
          description="The product you're looking for doesn't exist or has been removed."
          actionLabel="Back to Shop"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  const inWishlist = isInWishlist(product._id);
  const outOfStock = product.stock === 0;
  const savingsAmount = product.comparePrice
    ? product.comparePrice - product.price
    : 0;

  // Accordion items
  const accordionItems = [
    product.ingredients?.length > 0 && {
      title: 'Ingredients',
      content: product.ingredients.join(', '),
    },
    product.benefits?.length > 0 && {
      title: 'Benefits',
      content: product.benefits.join(', '),
    },
    {
      title: 'How To Use',
      content: product.howToUse || 'Apply a small amount to clean skin. Follow with moisturizer.',
    },
    product.certifications?.length > 0 && {
      title: 'Certifications',
      content: product.certifications.join(', '),
    },
  ].filter(Boolean);

  // Rating breakdown
  const totalRatings = reviews.length;
  const avgRating = product.ratings?.average || 0;
  const ratingCounts = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  return (
    <>
      <Helmet>
        <title>
          {product.seo?.metaTitle || `${product.name} — HOMA Beauty`}
        </title>
        <meta
          name="description"
          content={
            product.seo?.metaDescription ||
            product.description?.slice(0, 155) + '...'
          }
        />
        {product.seo?.focusKeyword && (
          <meta
            name="keywords"
            content={[
              product.seo.focusKeyword,
              ...(product.seo.keywords || []),
            ].join(', ')}
          />
        )}
        {product.seo?.canonicalUrl ? (
          <link rel="canonical" href={product.seo.canonicalUrl} />
        ) : (
          <link
            rel="canonical"
            href={`${window.location.origin}/products/${product._id}`}
          />
        )}
        <meta property="og:type" content="product" />
        <meta
          property="og:title"
          content={product.seo?.metaTitle || product.name}
        />
        <meta
          property="og:description"
          content={
            product.seo?.metaDescription || product.description?.slice(0, 155)
          }
        />
        <meta property="og:image" content={product.images?.[0]?.url} />
        <meta
          property="og:url"
          content={`${window.location.origin}/products/${product._id}`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={product.seo?.metaTitle || product.name}
        />
        <meta name="twitter:image" content={product.images?.[0]?.url} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            image: product.images?.map((i) => i.url),
            description: product.description,
            brand: { '@type': 'Brand', name: product.brand },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'NPR',
              price: product.price,
              availability:
                product.stock > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              seller: { '@type': 'Organization', name: 'HOMA Beauty' },
            },
            aggregateRating:
              product.ratings?.count > 0
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: product.ratings.average,
                    reviewCount: product.ratings.count,
                  }
                : undefined,
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Product Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* Left: Images */}
            <div>
              <ImageGallery images={product.images} />
            </div>

            {/* Right: Info */}
            <div>
              {/* Brand */}
              <p className="text-xs font-body font-semibold tracking-widest uppercase text-red-600 mb-2">
                {product.brand}
              </p>

              {/* Product Name */}
              <h1 className="font-display text-4xl md:text-5xl text-black mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="mb-6">
                <StarRating
                  rating={product.ratings?.average || 0}
                  count={product.ratings?.count || 0}
                  size="md"
                />
              </div>

              {/* Price Section */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="font-body text-sm text-gray-600 mb-2">Price</p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-display text-3xl font-bold text-black">
                    {formatPrice(product.price)}
                  </span>
                  {product.comparePrice && (
                    <span className="font-body text-lg text-gray-500 line-through">
                      {formatPrice(product.comparePrice)}
                    </span>
                  )}
                </div>
                {savingsAmount > 0 && (
                  <p className="font-body text-sm text-green-600">
                    Save {formatPrice(savingsAmount)}
                  </p>
                )}
              </div>

              {/* Skin Types */}
              {product.skinTypes?.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="font-body text-xs text-gray-600 mb-3 uppercase tracking-wide">
                    For Skin Types
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.skinTypes.map((type) => (
                      <span
                        key={type}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-body rounded-full"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Authenticity Badge */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <AuthenticityBadge />
              </div>

              {/* Quantity & Add to Cart */}
              <div className="space-y-4 mb-6">
                <div>
                  <p className="font-body text-xs text-gray-600 mb-3 uppercase tracking-wide">
                    Quantity
                  </p>
                  <QuantitySelector
                    value={qty}
                    onChange={setQty}
                    min={1}
                    max={product.stock}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className="w-full py-3 bg-black text-white font-body font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>

                <button
                  type="button"
                  onClick={() => toggle(product._id)}
                  className="w-full py-3 border border-gray-300 text-black font-body font-medium flex items-center justify-center gap-2 hover:border-gray-400 transition-colors"
                >
                  <Heart
                    size={18}
                    className={inWishlist ? 'fill-red-600 text-red-600' : 'text-gray-400'}
                  />
                  {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                </button>
              </div>

              {/* Description */}
              {product.description && (
                <div className="font-body text-sm text-gray-700 leading-relaxed">
                  {product.description}
                </div>
              )}
            </div>
          </div>

          {/* Accordion Section */}
          {accordionItems.length > 0 && (
            <div className="mb-16 pb-16 border-b border-gray-200">
              <AccordionSection items={accordionItems} />
            </div>
          )}

          {/* Reviews Section */}
          <div>
            <h2 className="font-display text-3xl text-black mb-8">
              Customer Reviews
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Rating Summary */}
              <div className="md:col-span-1">
                <div className="text-center mb-8">
                  <p className="font-display text-6xl font-bold text-black mb-2">
                    {avgRating.toFixed(1)}
                  </p>
                  <div className="mb-2">
                    <StarRating rating={avgRating} size="md" />
                  </div>
                  <p className="font-body text-sm text-gray-600">
                    Based on {totalRatings} reviews
                  </p>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="font-body text-xs text-gray-600 w-8">
                        {rating}★
                      </span>
                      <div className="flex-1 h-2 bg-gray-200">
                        <div
                          className="h-full bg-black"
                          style={{
                            width:
                              totalRatings > 0
                                ? `${(ratingCounts[rating] / totalRatings) * 100}%`
                                : '0%',
                          }}
                        />
                      </div>
                      <span className="font-body text-xs text-gray-600 w-12 text-right">
                        {ratingCounts[rating]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews List */}
              <div className="md:col-span-2">
                {reviewsLoading ? (
                  <div className="flex justify-center py-10">
                    <Spinner size="md" />
                  </div>
                ) : reviewsError ? (
                  <div className="py-8 text-center">
                    <p className="font-body text-sm text-gray-600">
                      Reviews could not be loaded. Please try again later.
                    </p>
                  </div>
                ) : reviews.length === 0 ? (
                  <EmptyState
                    title="No reviews yet"
                    description="Be the first to review this product."
                  />
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review._id} className="pb-6 border-b border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-body font-semibold text-black">
                              {review.user?.name || 'Anonymous'}
                            </p>
                            <p className="font-body text-xs text-gray-600">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        {review.title && (
                          <p className="font-body font-semibold text-black mb-1">
                            {review.title}
                          </p>
                        )}
                        <p className="font-body text-sm text-gray-700">
                          {review.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submit Review Form */}
                {user ? (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="font-display text-lg text-black mb-4">
                      Leave a Review
                    </h3>

                    {!reviewFormOpen ? (
                      <button
                        type="button"
                        onClick={() => setReviewFormOpen(true)}
                        className="px-4 py-2 border border-gray-300 text-black font-body text-sm hover:border-gray-400 transition-colors"
                      >
                        Write a Review
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {reviewError && (
                          <div className="p-3 bg-red-50 border border-red-200 text-red-800 font-body text-sm">
                            {reviewError}
                          </div>
                        )}

                        <div>
                          <p className="font-body text-sm text-gray-600 mb-2">
                            Rating *
                          </p>
                          <StarRating
                            rating={reviewForm.rating}
                            interactive
                            onRate={(r) => {
                              if (!submitReview.isPending) {
                                setReviewForm({ ...reviewForm, rating: r });
                              }
                            }}
                            size="lg"
                          />
                        </div>

                        <div>
                          <p className="font-body text-sm text-gray-600 mb-2">
                            Title (optional)
                          </p>
                          <input
                            type="text"
                            maxLength={100}
                            value={reviewForm.title}
                            disabled={submitReview.isPending}
                            onChange={(e) =>
                              setReviewForm({ ...reviewForm, title: e.target.value })
                            }
                            placeholder="Summarize your experience"
                            className="w-full border border-gray-300 px-3 py-2 font-body text-sm"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-body text-sm text-gray-600">
                              Review *
                            </p>
                            <p className="font-body text-xs text-gray-500">
                              {reviewForm.body.length}/1000
                            </p>
                          </div>
                          <textarea
                            value={reviewForm.body}
                            disabled={submitReview.isPending}
                            onChange={(e) =>
                              setReviewForm({
                                ...reviewForm,
                                body: e.target.value.substring(0, 1000),
                              })
                            }
                            placeholder="Share your experience with this product..."
                            rows={4}
                            className="w-full border border-gray-300 px-3 py-2 font-body text-sm resize-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSubmitReview}
                            disabled={submitReview.isPending}
                            className="flex-1 py-2 bg-black text-white font-body text-sm font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                          >
                            {submitReview.isPending ? (
                              <>
                                <Spinner size="sm" /> Submitting...
                              </>
                            ) : (
                              'Submit Review'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewFormOpen(false);
                              setReviewForm({ rating: 0, title: '', body: '' });
                              setReviewError('');
                            }}
                            className="px-4 py-2 border border-gray-300 text-black font-body text-sm hover:border-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="font-body text-sm text-gray-600">
                      <a
                        href="/login"
                        className="text-red-600 hover:underline font-semibold"
                      >
                        Log in
                      </a>{' '}
                      to leave a review
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
