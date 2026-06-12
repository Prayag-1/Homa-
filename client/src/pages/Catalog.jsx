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
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={`${window.location.origin}/shop`} />
      </Helmet>
      {/* Page Header */}
      <div className="border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h1 className="font-display text-4xl md:text-5xl text-black mb-2">
            All Products
          </h1>
          <p className="font-body text-gray-600">
            {total} products available
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6 flex justify-between items-center">
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 text-black hover:border-gray-400 transition-colors"
          >
            <Menu size={18} />
            <span className="font-body text-sm">Filters</span>
          </button>
          <span className="font-body text-xs text-gray-600">
            Showing {startProduct}–{endProduct} of {total}
          </span>
        </div>

        {/* Layout: Sidebar + Grid */}
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FilterSidebar isOpen={true} />
          </div>

          {/* Mobile Sidebar Drawer */}
          {filterDrawerOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/30 lg:hidden"
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
              <p className="font-body text-sm text-gray-600">
                Showing {startProduct}–{endProduct} of {total} products
              </p>
            </div>

            {/* Error State */}
            {isError && (
              <div className="py-16 text-center">
                <p className="font-body text-gray-600 mb-4">
                  Something went wrong. Try again.
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="px-6 py-2 bg-black text-white font-body text-sm font-medium hover:bg-gray-900 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className="p-2 border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Page Numbers */}
                {generatePageNumbers().map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 font-body text-sm ${
                      currentPage === page
                        ? 'bg-black text-white'
                        : 'border border-gray-300 text-black hover:border-gray-400'
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
                  className="p-2 border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
