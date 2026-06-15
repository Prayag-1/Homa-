import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import FilterSidebar from '../components/product/FilterSidebar';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';
import EmptyState from '../components/common/EmptyState';
import { useProducts } from '../hooks/useProducts';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Build filters object from URL params
  const filters = {
    brand: searchParams.get('brand') || undefined,
    skinType: searchParams.get('skinType') || undefined,
    category: searchParams.get('category') || undefined,
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
    search: searchParams.get('search') || undefined,
    sort: searchParams.get('sort') || undefined,
    page: searchParams.get('page') || 1,
    limit: 12,
  };

  const { data, isLoading, isError, refetch } = useProducts(filters);

  const products = data?.items || [];
  const total = data?.total || 0;
  const currentPage = Number(filters.page);
  const totalPages = data?.totalPages || 1;

  // Generate page numbers (show max 5 page buttons)
  const generatePageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);

    if (end - start < 4) {
      if (start === 1) end = Math.min(5, totalPages);
      else start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const renderProduct = useCallback((product) => (
    <ProductCard key={product._id} product={product} />
  ), []);

  // Calculate product range being shown
  const startProduct = (currentPage - 1) * 12 + 1;
  const endProduct = Math.min(currentPage * 12, total);

  // Generate dynamic SEO title and description
  const categoryParam = searchParams.get('category');
  const brandParam = searchParams.get('brand');
  const seoTitle = categoryParam
    ? `${categoryParam} — Shop HOMA Beauty`
    : brandParam
    ? `${brandParam} Products — HOMA Beauty`
    : 'Shop All Products — HOMA Beauty';

  const seoDescription = categoryParam
    ? `Shop authentic Japanese ${categoryParam} products in Nepal. Certified, direct-import skincare from HOMA Beauty.`
    : 'Browse authentic Japanese skincare products in Nepal. Hydrators, serums, toners, sunscreens and more. Direct import from Japan.';

  return (
    <div className="min-h-screen bg-homa-cream">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={`${window.location.origin}/shop`} />
      </Helmet>
      <div className="sakura-pattern bg-homa-red px-5 py-12 text-white md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 font-body text-xs text-white/75">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span>Shop</span>
          </div>
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
            Our Collection
          </p>
          <h1 className="mt-3 font-heading text-5xl font-semibold text-white">
            All Products
          </h1>
          <p className="mt-3 font-body text-sm text-white/70">
            {total} products available
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-12">
        {/* Mobile Filter Toggle */}
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="flex items-center gap-2 rounded-pill border border-homa-red px-4 py-2 text-homa-red transition-colors hover:bg-homa-red hover:text-white"
          >
            <Menu size={18} />
            <span className="font-body text-sm">Filters</span>
          </button>
          <span className="font-body text-xs text-homa-grey">
            Showing {startProduct}–{endProduct} of {total}
          </span>
        </div>

        {/* Layout: Sidebar + Grid */}
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden w-80 flex-shrink-0 lg:block">
            <FilterSidebar isOpen={true} />
          </div>

          {/* Mobile Sidebar Drawer */}
          {filterDrawerOpen && (
            <div
              className="fixed inset-0 z-30 bg-homa-black/45 lg:hidden"
              onClick={() => setFilterDrawerOpen(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <FilterSidebar
                  isOpen={filterDrawerOpen}
                  onClose={() => setFilterDrawerOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            {/* Product Count - Desktop only */}
            <div className="hidden lg:block mb-6 text-right">
              <p className="font-body text-sm text-homa-grey">
                Showing {startProduct}–{endProduct} of {total} products
              </p>
            </div>

            {/* Error State */}
            {isError && (
              <div className="py-16 text-center">
                <p className="mb-4 font-body text-homa-grey">
                  Something went wrong. Try again.
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-pill bg-homa-red px-6 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-homa-red-dark"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && products.length === 0 && (
              <EmptyState
                icon={null}
                title="No products found"
                description="Try adjusting your filters or search terms."
                actionLabel="Clear Filters"
                onAction={handleClearFilters}
              />
            )}

            {/* Product Grid */}
            {!isLoading && products.length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {products.map(renderProduct)}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && products.length > 0 && totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-pill border border-[#F0E8E8] bg-white p-2 text-homa-black transition-colors hover:border-homa-red hover:text-homa-red disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Page Numbers */}
                {generatePageNumbers().map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`h-10 w-10 rounded-pill font-body text-sm ${
                      currentPage === page
                        ? 'bg-homa-red text-white'
                        : 'border border-[#F0E8E8] bg-white text-homa-black hover:border-homa-red hover:text-homa-red'
                    } transition-colors`}
                  >
                    {page}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-pill border border-[#F0E8E8] bg-white p-2 text-homa-black transition-colors hover:border-homa-red hover:text-homa-red disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
