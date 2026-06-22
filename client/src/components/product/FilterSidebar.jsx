import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { usePublicBrands, usePublicCategories } from '../../hooks/useAdminBrandsCategories';

export const sortOptions = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-ratings.average', label: 'Top Rated' },
];

export const getActiveFilterCount = (searchParams) =>
  [
    searchParams.get('skinType'),
    searchParams.get('category'),
    searchParams.get('brand'),
    searchParams.get('minPrice'),
    searchParams.get('maxPrice'),
  ].filter(Boolean).length;

export function FilterSidebarContent({ includeSort = true, onClearAll }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [priceMin, setPriceMin] = useState(searchParams.get('minPrice') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('maxPrice') || '');

  const { data: brands = [], isLoading: brandsLoading } = usePublicBrands();
  const { data: categories = [], isLoading: catsLoading } = usePublicCategories();

  const activeBrands = brands
    .filter((brand) => brand.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));

  const activeCategories = categories
    .filter((category) => category.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));

  const skinTypes = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Acne-Prone'];
  const activeFilters = getActiveFilterCount(searchParams);
  const isPositiveNumber = (value) => value === '' || (/^\d+(\.\d+)?$/.test(value) && Number(value) > 0);

  const handlePriceInput = (type, value) => {
    if (!isPositiveNumber(value)) return;

    if (type === 'min') {
      if (priceMax && value && Number(value) > Number(priceMax)) return;
      setPriceMin(value);
    } else {
      if (priceMin && value && Number(value) < Number(priceMin)) return;
      setPriceMax(value);
    }
  };

  const handleCheckboxChange = (filterName, value, isChecked) => {
    const newParams = new URLSearchParams(searchParams);
    if (isChecked) {
      newParams.set(filterName, value);
    } else {
      newParams.delete(filterName);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePriceChange = (type) => {
    const newParams = new URLSearchParams(searchParams);
    if (type === 'min') {
      if (priceMin) {
        newParams.set('minPrice', priceMin);
      } else {
        newParams.delete('minPrice');
      }
    } else if (priceMax) {
      newParams.set('maxPrice', priceMax);
    } else {
      newParams.delete('maxPrice');
    }

    const min = Number(newParams.get('minPrice'));
    const max = Number(newParams.get('maxPrice'));
    if (newParams.get('minPrice') && newParams.get('maxPrice') && min > max) return;

    newParams.set('page', '1');
    setSearchParams(newParams);
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

  const handleClearAll = () => {
    setSearchParams(new URLSearchParams());
    setPriceMin('');
    setPriceMax('');
    onClearAll?.();
  };

  return (
    <>
      {activeFilters > 0 && (
        <button
          type="button"
          onClick={handleClearAll}
          className="mb-6 w-full font-body text-sm font-semibold text-homa-red transition hover:underline"
        >
          Clear All Filters
        </button>
      )}

      <div className="mb-6 border-b border-[#F0E8E8] pb-6">
        <h3 className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.15em] text-homa-grey">
          Skin Type
        </h3>
        <div className="space-y-2">
          {skinTypes.map((type) => (
            <label key={type} className="flex min-h-[44px] cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={searchParams.get('skinType') === type}
                onChange={(event) => handleCheckboxChange('skinType', type, event.target.checked)}
                className="h-4 w-4 accent-homa-red"
              />
              <span className="font-body text-sm text-homa-black">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6 border-b border-[#F0E8E8] pb-6">
        <h3 className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.15em] text-homa-grey">
          Category
        </h3>
        <div className="space-y-2">
          {catsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-4 w-24 animate-pulse rounded bg-homa-blush" />
            ))
          ) : activeCategories.length > 0 ? (
            activeCategories.map((category) => (
              <label key={category._id} className="flex min-h-[44px] cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={searchParams.get('category') === category.name}
                  onChange={(event) => handleCheckboxChange('category', category.name, event.target.checked)}
                  className="h-4 w-4 accent-homa-red"
                />
                <span className="font-body text-sm text-homa-black">{category.name}</span>
              </label>
            ))
          ) : (
            <p className="font-body text-xs text-homa-grey">No categories available</p>
          )}
        </div>
      </div>

      <div className="mb-6 border-b border-[#F0E8E8] pb-6">
        <h3 className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.15em] text-homa-grey">
          Brand
        </h3>
        <div className="space-y-2">
          {brandsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-4 w-28 animate-pulse rounded bg-homa-blush" />
            ))
          ) : activeBrands.length > 0 ? (
            activeBrands.map((brand) => (
              <label key={brand._id} className="flex min-h-[44px] cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={searchParams.get('brand') === brand.name}
                  onChange={(event) => handleCheckboxChange('brand', brand.name, event.target.checked)}
                  className="h-4 w-4 accent-homa-red"
                />
                <span className="font-body text-sm text-homa-black">{brand.name}</span>
              </label>
            ))
          ) : (
            <p className="font-body text-xs text-homa-grey">No brands available</p>
          )}
        </div>
      </div>

      <div className="mb-6 border-b border-[#F0E8E8] pb-6">
        <h3 className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.15em] text-homa-grey">
          Price Range
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-body text-xs uppercase tracking-[0.08em] text-homa-grey">
              Min Price (NPR)
            </label>
            <input
              type="number"
              min="1"
              value={priceMin}
              onChange={(event) => handlePriceInput('min', event.target.value)}
              onBlur={() => handlePriceChange('min')}
              placeholder="500"
              className="w-full border-0 border-b-2 border-homa-red bg-transparent px-0 py-2 font-body text-sm text-homa-black outline-none placeholder:text-homa-grey"
            />
          </div>
          <div>
            <label className="mb-1 block font-body text-xs uppercase tracking-[0.08em] text-homa-grey">
              Max Price (NPR)
            </label>
            <input
              type="number"
              min="1"
              value={priceMax}
              onChange={(event) => handlePriceInput('max', event.target.value)}
              onBlur={() => handlePriceChange('max')}
              placeholder="10000"
              className="w-full border-0 border-b-2 border-homa-red bg-transparent px-0 py-2 font-body text-sm text-homa-black outline-none placeholder:text-homa-grey"
            />
          </div>
        </div>
      </div>

      {includeSort && (
        <div>
          <h3 className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.15em] text-homa-grey">
            Sort By
          </h3>
          <select
            value={searchParams.get('sort') || '-createdAt'}
            onChange={handleSortChange}
            className="w-full rounded-lg border border-[#F0E8E8] bg-white px-3 py-2 font-body text-sm text-homa-black outline-none transition focus:border-homa-red"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}

const FilterSidebar = () => {
  const [searchParams] = useSearchParams();
  const activeFilters = getActiveFilterCount(searchParams);

  return (
    <aside className="sticky top-24 max-h-[calc(100vh-120px)] w-80 overflow-y-auto rounded-tl-2xl border-r border-[#F0E8E8] bg-white">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between border-b border-[#F0E8E8] pb-6">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg text-homa-black">Filters</h2>
            {activeFilters > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-homa-red px-1.5 font-body text-xs font-bold text-white">
                {activeFilters}
              </span>
            )}
          </div>
        </div>
        <FilterSidebarContent />
      </div>
    </aside>
  );
};

export default FilterSidebar;
