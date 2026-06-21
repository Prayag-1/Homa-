import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import FilterSidebar, {
  FilterSidebarContent,
  getActiveFilterCount,
  sortOptions,
} from '../components/product/FilterSidebar';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';
import EmptyState from '../components/common/EmptyState';
import BottomSheet from '../components/common/BottomSheet';
import { Badge } from '../components/ui/Badge';
import { useProducts } from '../hooks/useProducts';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const brandParam = searchParams.get('brand') || undefined;
  const categoryParam = searchParams.get('category') || undefined;
  const skinTypeParam = searchParams.get('skinType') || undefined;
  const minPriceParam = searchParams.get('minPrice') || undefined;
  const maxPriceParam = searchParams.get('maxPrice') || undefined;
  const searchParam = searchParams.get('search') || undefined;
  const sortParam = searchParams.get('sort') || undefined;
  const pageParam = searchParams.get('page') || 1;

  const filters = useMemo(() => ({
    brand: brandParam,
    skinType: skinTypeParam,
    category: categoryParam,
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    search: searchParam,
    sort: sortParam,
    page: pageParam,
    limit: 12,
  }), [brandParam, categoryParam, skinTypeParam, minPriceParam, maxPriceParam, searchParam, sortParam, pageParam]);

  const { data, isLoading, isError, refetch } = useProducts(filters);

  const products = data?.items || [];
  const total = data?.total || 0;
  const currentPage = Number(filters.page);
  const totalPages = data?.totalPages || 1;
  const activeFilterCount = getActiveFilterCount(searchParams);
  const startProduct = total > 0 ? (currentPage - 1) * 12 + 1 : 0;
  const endProduct = Math.min(currentPage * 12, total);

  const generatePageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);

    if (end - start < 4) {
      if (start === 1) end = Math.min(5, totalPages);
      else start = Math.max(1, end - 4);
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
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

  const handleSortChange = (event) => {
    const newParams = new URLSearchParams(searchParams);
    if (event.target.value) {
      newParams.set('sort', event.target.value);
    } else {
      newParams.delete('sort');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const renderProduct = useCallback((product) => (
    <ProductCard key={product._id} product={product} />
  ), []);

  const seoTitle = categoryParam
    ? `${categoryParam} - Shop HOMA Beauty`
    : brandParam
    ? `${brandParam} Products - HOMA Beauty`
    : 'Shop All Products - HOMA Beauty';

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

      <div className="sakura-pattern bg-homa-red px-5 py-8 text-white md:px-12 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 font-body text-xs text-white/75">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span>Shop</span>
          </div>
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
            Our Collection
          </p>
          <h1 className="text-h1 mt-3 font-heading font-semibold text-white">
            All Products
          </h1>

          <div className="mt-5 flex flex-col gap-3 lg:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className="touch-target flex items-center gap-2 rounded-full border border-white/70 px-4 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <SlidersHorizontal size={16} />
                Filters
                {activeFilterCount > 0 && <Badge color="red">{activeFilterCount}</Badge>}
              </button>
              <select
                value={searchParams.get('sort') || '-createdAt'}
                onChange={handleSortChange}
                className="min-h-[44px] min-w-0 flex-1 rounded-full border border-white/70 bg-white/10 px-4 py-2 font-body text-sm text-white outline-none"
                aria-label="Sort products"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value} className="text-homa-black">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="font-body text-xs text-white/70">
              Showing {startProduct}-{endProduct} of {total}
            </p>
          </div>

          <p className="mt-3 hidden font-body text-sm text-white/70 lg:block">
            {total} products available
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-0 py-8 md:px-12">
        <div className="flex gap-8">
          <div className="hidden w-80 flex-shrink-0 lg:block">
            <FilterSidebar />
          </div>

          <BottomSheet
            isOpen={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            title="Filters"
            snapHeight="full"
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="font-body text-sm font-semibold text-homa-red"
              >
                Clear All
              </button>
            </div>
            <FilterSidebarContent includeSort={false} />
            <div className="sticky bottom-0 -mx-5 mt-6 border-t border-[#F0E8E8] bg-white px-5 py-4 safe-bottom">
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="touch-target w-full rounded-pill bg-homa-red font-body text-sm font-bold uppercase tracking-[0.1em] text-white"
              >
                Apply Filters
              </button>
            </div>
          </BottomSheet>

          <div className="min-w-0 flex-1">
            <div className="mb-6 hidden text-right lg:block">
              <p className="font-body text-sm text-homa-grey">
                Showing {startProduct}-{endProduct} of {total} products
              </p>
            </div>

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

            {isLoading && (
              <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 md:gap-4 md:px-6 lg:grid-cols-4 lg:gap-6 lg:px-8">
                {Array.from({ length: 12 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            )}

            {!isLoading && products.length === 0 && (
              <EmptyState
                icon={null}
                title="No products found"
                description="Try adjusting your filters or search terms."
                actionLabel="Clear Filters"
                onAction={handleClearFilters}
              />
            )}

            {!isLoading && products.length > 0 && (
              <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 md:gap-4 md:px-6 lg:grid-cols-4 lg:gap-6 lg:px-8">
                {products.map(renderProduct)}
              </div>
            )}

            {!isLoading && products.length > 0 && totalPages > 1 && (
              <div className="mt-12">
                <div className="flex items-center justify-center gap-3 sm:hidden">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="touch-target rounded-pill border border-[#F0E8E8] bg-white text-homa-black transition-colors hover:border-homa-red hover:text-homa-red disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-body text-sm font-semibold text-homa-black">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="touch-target rounded-pill border border-[#F0E8E8] bg-white text-homa-black transition-colors hover:border-homa-red hover:text-homa-red disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="hidden items-center justify-center gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-pill border border-[#F0E8E8] bg-white p-2 text-homa-black transition-colors hover:border-homa-red hover:text-homa-red disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={18} />
                  </button>

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

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-pill border border-[#F0E8E8] bg-white p-2 text-homa-black transition-colors hover:border-homa-red hover:text-homa-red disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
