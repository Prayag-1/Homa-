import { useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProduct, useProductReviews, useSubmitReview } from '../hooks/useProducts';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../hooks/useAuth';
import { CartContext } from '../context/CartContext';
import ImageGallery from '../components/product/ImageGallery';
import StarRating from '../components/product/StarRating';
import AuthenticityBadge from '../components/product/AuthenticityBadge';
import QuantitySelector from '../components/product/QuantitySelector';
import AccordionSection from '../components/product/AccordionSection';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { formatPrice } from '../utils/formatPrice';

const fieldClass = 'w-full rounded-lg border border-[#F0E8E8] px-3 py-2 font-body text-sm text-homa-black outline-none transition focus:border-homa-red';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useContext(CartContext);
  const { isInWishlist, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', body: '' });
  const [reviewError, setReviewError] = useState('');

  const { data: product, isLoading, isError } = useProduct(id);
  const { data: reviews = [], isLoading: reviewsLoading, isError: reviewsError } = useProductReviews(id);
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

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-homa-cream">
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
      <div className="min-h-screen bg-homa-cream">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-12">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="animate-pulse rounded-2xl bg-white" style={{ aspectRatio: '1/1' }} />
            <div className="space-y-6">
              <div className="h-3 w-20 animate-pulse bg-homa-blush" />
              <div className="space-y-2">
                <div className="h-8 w-full animate-pulse bg-homa-blush" />
                <div className="h-6 w-2/3 animate-pulse bg-homa-blush" />
              </div>
              <div className="h-4 w-32 animate-pulse bg-homa-blush" />
              <div className="space-y-3">
                <div className="h-6 w-32 animate-pulse bg-homa-blush" />
                <div className="h-4 w-40 animate-pulse bg-homa-blush" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-homa-cream">
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
  const savingsAmount = product.comparePrice ? product.comparePrice - product.price : 0;

  const accordionItems = [
    product.ingredients?.length > 0 && { title: 'Ingredients', content: product.ingredients.join(', ') },
    product.benefits?.length > 0 && { title: 'Benefits', content: product.benefits.join(', ') },
    { title: 'How To Use', content: product.howToUse || 'Apply a small amount to clean skin. Follow with moisturizer.' },
    product.certifications?.length > 0 && { title: 'Certifications', content: product.certifications.join(', ') },
  ].filter(Boolean);

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
        <title>{product.seo?.metaTitle || `${product.name} - HOMA Beauty`}</title>
        <meta
          name="description"
          content={product.seo?.metaDescription || `${product.description?.slice(0, 155)}...`}
        />
        {product.seo?.focusKeyword && (
          <meta name="keywords" content={[product.seo.focusKeyword, ...(product.seo.keywords || [])].join(', ')} />
        )}
        {product.seo?.canonicalUrl ? (
          <link rel="canonical" href={product.seo.canonicalUrl} />
        ) : (
          <link rel="canonical" href={`${window.location.origin}/products/${product._id}`} />
        )}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={product.seo?.metaTitle || product.name} />
        <meta property="og:description" content={product.seo?.metaDescription || product.description?.slice(0, 155)} />
        <meta property="og:image" content={product.images?.[0]?.url} />
        <meta property="og:url" content={`${window.location.origin}/products/${product._id}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.seo?.metaTitle || product.name} />
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
              availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
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

      <div className="min-h-screen bg-homa-cream">
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-12">
          <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2">
            <ImageGallery images={product.images} />

            <div>
              <p className="mb-2 font-body text-[11px] font-bold uppercase tracking-[0.15em] text-homa-red">
                {product.brand}
              </p>
              <h1 className="mb-4 font-heading text-2xl font-semibold text-homa-black md:text-4xl">
                {product.name}
              </h1>

              <div className="mb-6">
                <StarRating rating={product.ratings?.average || 0} count={product.ratings?.count || 0} size="md" />
              </div>

              <div className="mb-6 border-b border-[#F0E8E8] pb-6">
                <p className="mb-2 font-body text-sm text-homa-grey">Price</p>
                <div className="mb-2 flex items-center gap-3">
                  <span className="font-body text-[28px] font-bold text-homa-black">{formatPrice(product.price)}</span>
                  {product.comparePrice && (
                    <span className="font-body text-lg text-homa-grey line-through">
                      {formatPrice(product.comparePrice)}
                    </span>
                  )}
                </div>
                {savingsAmount > 0 && (
                  <p className="inline-flex rounded-pill bg-homa-red px-3 py-1 font-body text-xs font-bold uppercase tracking-[0.08em] text-white">
                    Save {formatPrice(savingsAmount)}
                  </p>
                )}
              </div>

              {product.skinTypes?.length > 0 && (
                <div className="mb-6 border-b border-[#F0E8E8] pb-6">
                  <p className="mb-3 font-body text-xs uppercase tracking-[0.12em] text-homa-grey">For Skin Types</p>
                  <div className="flex flex-wrap gap-2">
                    {product.skinTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-pill bg-homa-blush px-3 py-1 font-body text-[10px] font-bold uppercase tracking-[0.08em] text-homa-red"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6 border-b border-[#F0E8E8] pb-6">
                <AuthenticityBadge />
              </div>

              <div className="mb-6 space-y-4">
                <div>
                  <p className="mb-3 font-body text-xs uppercase tracking-[0.12em] text-homa-grey">Quantity</p>
                  <QuantitySelector value={qty} onChange={setQty} min={1} max={product.stock} />
                </div>

                <Button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>

                <Button
                  type="button"
                  onClick={() => toggle(product._id)}
                  variant="outline"
                  size="md"
                  className="w-full"
                >
                  <Heart size={18} className={inWishlist ? 'fill-homa-red text-homa-red' : 'text-homa-grey'} />
                  {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                </Button>
              </div>

              {product.description && (
                <div className="font-body text-sm leading-7 text-homa-grey">{product.description}</div>
              )}
            </div>
          </div>

          {accordionItems.length > 0 && (
            <div className="mb-16">
              <AccordionSection items={accordionItems} />
            </div>
          )}

          <div className="rounded-2xl bg-homa-blush p-6 md:p-8">
            <h2 className="mb-8 font-heading text-3xl text-homa-black">Customer Reviews</h2>

            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="mb-8 text-center">
                  <p className="mb-2 font-heading text-[64px] font-bold leading-none text-homa-red">
                    {avgRating.toFixed(1)}
                  </p>
                  <div className="mb-2">
                    <StarRating rating={avgRating} size="md" />
                  </div>
                  <p className="font-body text-sm text-homa-grey">Based on {totalRatings} reviews</p>
                </div>

                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="w-8 font-body text-xs text-homa-grey">{rating} star</span>
                      <div className="h-2 flex-1 bg-white">
                        <div
                          className="h-full bg-homa-red"
                          style={{
                            width: totalRatings > 0 ? `${(ratingCounts[rating] / totalRatings) * 100}%` : '0%',
                          }}
                        />
                      </div>
                      <span className="w-12 text-right font-body text-xs text-homa-grey">{ratingCounts[rating]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                {reviewsLoading ? (
                  <div className="flex justify-center py-10">
                    <Spinner size="md" />
                  </div>
                ) : reviewsError ? (
                  <div className="py-8 text-center">
                    <p className="font-body text-sm text-homa-grey">Reviews could not be loaded. Please try again later.</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <EmptyState title="No reviews yet" description="Be the first to review this product." />
                ) : (
                  <div className="space-y-5">
                    {reviews.map((review) => (
                      <div key={review._id} className="rounded-xl bg-white p-5">
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <p className="font-body font-semibold text-homa-black">
                              {review.user?.name || 'Anonymous'}
                            </p>
                            <p className="font-body text-xs text-homa-grey">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        {review.title && <p className="mb-1 font-body font-semibold text-homa-black">{review.title}</p>}
                        <p className="font-body text-sm text-homa-grey">{review.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {user ? (
                  <div className="mt-8 rounded-2xl bg-white p-6">
                    <h3 className="mb-4 font-heading text-lg text-homa-black">Leave a Review</h3>

                    {!reviewFormOpen ? (
                      <button
                        type="button"
                        onClick={() => setReviewFormOpen(true)}
                        className="rounded-pill border border-homa-red px-4 py-2 font-body text-sm font-semibold text-homa-red transition-colors hover:bg-homa-red hover:text-white"
                      >
                        Write a Review
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {reviewError && (
                          <div className="rounded-lg border border-homa-red/20 bg-homa-red-light p-3 font-body text-sm text-homa-red">
                            {reviewError}
                          </div>
                        )}

                        <div>
                          <p className="mb-2 font-body text-sm text-homa-grey">Rating *</p>
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
                          <p className="mb-2 font-body text-sm text-homa-grey">Title (optional)</p>
                          <input
                            type="text"
                            maxLength={100}
                            value={reviewForm.title}
                            disabled={submitReview.isPending}
                            onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                            placeholder="Summarize your experience"
                            className={fieldClass}
                          />
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="font-body text-sm text-homa-grey">Review *</p>
                            <p className="font-body text-xs text-homa-grey">{reviewForm.body.length}/1000</p>
                          </div>
                          <textarea
                            value={reviewForm.body}
                            disabled={submitReview.isPending}
                            onChange={(e) =>
                              setReviewForm({ ...reviewForm, body: e.target.value.substring(0, 1000) })
                            }
                            placeholder="Share your experience with this product..."
                            rows={4}
                            className={`${fieldClass} resize-none`}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSubmitReview}
                            disabled={submitReview.isPending}
                            className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-homa-red py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-homa-red-dark disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="rounded-pill border border-[#F0E8E8] px-4 py-2 font-body text-sm text-homa-black transition-colors hover:border-homa-red hover:text-homa-red"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-8 rounded-2xl bg-white p-6">
                    <p className="font-body text-sm text-homa-grey">
                      <a href="/login" className="font-semibold text-homa-red hover:underline">
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
