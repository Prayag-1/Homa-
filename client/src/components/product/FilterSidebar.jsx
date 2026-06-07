import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { useState } from 'react';

const FilterSidebar = ({ isOpen = true, onClose }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [priceMin, setPriceMin] = useState(searchParams.get('minPrice') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('maxPrice') || '');

  const skinTypes = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Acne-Prone'];
  const categories = [
    'Moisturiser',
    'Serum',
    'Toner',
    'Sunscreen',
    'Cleanser',
    'Eye Care',
  ];
  const brands = ['Hada Labo', 'SK-II', 'Shiseido', 'Cosrx', 'Biore', 'Kose'];
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
      } fixed left-0 top-0 z-40 h-screen w-80 bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 lg:translate-x-0 lg:relative lg:h-auto lg:w-80`}
    >
      <div className="p-6 lg:p-0">
        {/* Mobile Close Button */}
        <div className="flex justify-between items-center mb-6 lg:hidden">
          <h2 className="font-display text-lg text-black">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg text-black">Filters</h2>
            {activeFilters > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-600 text-white rounded-full">
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
            className="w-full mb-6 px-4 py-2 border border-gray-300 text-black font-body text-sm hover:border-gray-400 transition-colors"
          >
            Clear All Filters
          </button>
        )}

        {/* Skin Type */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-display text-sm font-medium text-black mb-3">
            Skin Type
          </h3>
          <div className="space-y-2">
            {skinTypes.map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchParams.get('skinType') === type}
                  onChange={(e) =>
                    handleCheckboxChange('skinType', type, e.target.checked)
                  }
                  className="w-4 h-4 border border-gray-300"
                />
                <span className="font-body text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-display text-sm font-medium text-black mb-3">
            Category
          </h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchParams.get('category') === cat}
                  onChange={(e) =>
                    handleCheckboxChange('category', cat, e.target.checked)
                  }
                  className="w-4 h-4 border border-gray-300"
                />
                <span className="font-body text-sm text-gray-700">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Brand */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-display text-sm font-medium text-black mb-3">
            Brand
          </h3>
          <div className="space-y-2">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchParams.get('brand') === brand}
                  onChange={(e) =>
                    handleCheckboxChange('brand', brand, e.target.checked)
                  }
                  className="w-4 h-4 border border-gray-300"
                />
                <span className="font-body text-sm text-gray-700">{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-display text-sm font-medium text-black mb-3">
            Price Range
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block font-body text-xs text-gray-600 mb-1">
                Min Price (NPR)
              </label>
              <input
                type="number"
                min="1"
                value={priceMin}
                onChange={(e) => handlePriceInput('min', e.target.value)}
                onBlur={() => handlePriceChange('min')}
                placeholder="500"
                className="w-full border border-gray-300 px-3 py-2 font-body text-sm"
              />
            </div>
            <div>
              <label className="block font-body text-xs text-gray-600 mb-1">
                Max Price (NPR)
              </label>
              <input
                type="number"
                min="1"
                value={priceMax}
                onChange={(e) => handlePriceInput('max', e.target.value)}
                onBlur={() => handlePriceChange('max')}
                placeholder="10000"
                className="w-full border border-gray-300 px-3 py-2 font-body text-sm"
              />
            </div>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <h3 className="font-display text-sm font-medium text-black mb-3">
            Sort By
          </h3>
          <select
            value={searchParams.get('sort') || '-createdAt'}
            onChange={handleSortChange}
            className="w-full border border-gray-300 px-3 py-2 font-body text-sm bg-white"
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
