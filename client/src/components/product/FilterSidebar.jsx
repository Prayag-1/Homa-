import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { useState } from 'react';
import { usePublicBrands, usePublicCategories } from '../../hooks/useAdminBrandsCategories';

const FilterSidebar = ({ isOpen = true, onClose }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [priceMin, setPriceMin] = useState(searchParams.get('minPrice') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('maxPrice') || '');

  // Dynamic data from API
  const { data: brands = [], isLoading: brandsLoading } = usePublicBrands();
  const { data: categories = [], isLoading: catsLoading } = usePublicCategories();

  const activeBrands = brands
    .filter((b) => b.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));

  const activeCategories = categories
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));

  const skinTypes = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Acne-Prone'];
  const sortOptions = [
    { value: '-createdAt', label: 'Newest' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-ratings.average', label: 'Top Rated' },
  ];

  // Get active filters
  const activeFilters = [
    searchParams.get('skinType'),
    searchParams.get('category'),
    searchParams.get('brand'),
    searchParams.get('minPrice'),
    searchParams.get('maxPrice'),
  ].filter(Boolean).length;

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
    newParams.set('page', '1'); // Reset to page 1 when filtering
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
    } else {
      if (priceMax) {
        newParams.set('maxPrice', priceMax);
      } else {
        newParams.delete('maxPrice');
      }
    }

    const min = Number(newParams.get('minPrice'));
    const max = Number(newParams.get('maxPrice'));
    if (newParams.get('minPrice') && newParams.get('maxPrice') && min > max) {
      return;
    }

    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSortChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newParams.set('sort', e.target.value);
    } else {
      newParams.delete('sort');
    }
    setSearchParams(newParams);
  };

  const handleClearAll = () => {
    setSearchParams(new URLSearchParams());
    setPriceMin('');
    setPriceMax('');
  };

  return (
    <div
      className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed left-0 top-0 z-40 h-screen w-80 overflow-y-auto border-r border-[#F0E8E8] bg-white transition-transform duration-300 lg:relative lg:h-auto lg:w-80 lg:translate-x-0 lg:rounded-tl-2xl`}
    >
      <div className="p-6">
        {/* Mobile Close Button */}
        <div className="flex justify-between items-center mb-6 lg:hidden">
          <h2 className="font-heading text-lg text-homa-black">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-homa-black transition hover:text-homa-red"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="mb-6 hidden items-center justify-between border-b border-[#F0E8E8] pb-6 lg:flex">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg text-homa-black">Filters</h2>
            {activeFilters > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-homa-red px-1.5 font-body text-xs font-bold text-white">
                {activeFilters}
              </span>
            )}
          </div>
        </div>

        {/* Clear All Button */}
        {activeFilters > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="mb-6 w-full font-body text-sm font-semibold text-homa-red transition hover:underline"
          >
            Clear All Filters
          </button>
        )}

        {/* Skin Type */}
        <div className="mb-6 border-b border-[#F0E8E8] pb-6">
          <h3 className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.15em] text-homa-grey">
            Skin Type
          </h3>
          <div className="space-y-2">
            {skinTypes.map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={searchParams.get('skinType') === type}
                  onChange={(e) =>
                    handleCheckboxChange('skinType', type, e.target.checked)
                  }
                  className="h-4 w-4 accent-homa-red"
                />
                <span className="font-body text-sm text-homa-black">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="mb-6 border-b border-[#F0E8E8] pb-6">
          <h3 className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.15em] text-homa-grey">
            Category
          </h3>
          <div className="space-y-2">
            {catsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-4 w-24 animate-pulse rounded bg-homa-blush" />
              ))
            ) : activeCategories.length > 0 ? (
              activeCategories.map((cat) => (
                <label
                  key={cat._id}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={searchParams.get('category') === cat.name}
                    onChange={(e) =>
                      handleCheckboxChange('category', cat.name, e.target.checked)
                    }
                    className="h-4 w-4 accent-homa-red"
                  />
                  <span className="font-body text-sm text-homa-black">{cat.name}</span>
                </label>
              ))
            ) : (
              <p className="font-body text-xs text-homa-grey">
                No categories available
              </p>
            )}
          </div>
        </div>

        {/* Brand */}
        <div className="mb-6 border-b border-[#F0E8E8] pb-6">
          <h3 className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.15em] text-homa-grey">
            Brand
          </h3>
          <div className="space-y-2">
            {brandsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-4 w-28 animate-pulse rounded bg-homa-blush" />
              ))
            ) : activeBrands.length > 0 ? (
              activeBrands.map((brand) => (
                <label
                  key={brand._id}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={searchParams.get('brand') === brand.name}
                    onChange={(e) =>
                      handleCheckboxChange('brand', brand.name, e.target.checked)
                    }
                    className="h-4 w-4 accent-homa-red"
                  />
                  <span className="font-body text-sm text-homa-black">{brand.name}</span>
                </label>
              ))
            ) : (
              <p className="font-body text-xs text-homa-grey">
                No brands available
              </p>
            )}
          </div>
        </div>

        {/* Price Range */}
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
                onChange={(e) => handlePriceInput('min', e.target.value)}
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
                onChange={(e) => handlePriceInput('max', e.target.value)}
                onBlur={() => handlePriceChange('max')}
                placeholder="10000"
                className="w-full border-0 border-b-2 border-homa-red bg-transparent px-0 py-2 font-body text-sm text-homa-black outline-none placeholder:text-homa-grey"
              />
            </div>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <h3 className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.15em] text-homa-grey">
            Sort By
          </h3>
          <select
            value={searchParams.get('sort') || '-createdAt'}
            onChange={handleSortChange}
            className="w-full rounded-lg border border-[#F0E8E8] bg-white px-3 py-2 font-body text-sm text-homa-black outline-none transition focus:border-homa-red"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
