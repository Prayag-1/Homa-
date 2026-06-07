import { Minus, Plus } from 'lucide-react';

const QuantitySelector = ({
  value = 1,
  onChange,
  min = 1,
  max = 10,
  disabled = false,
}) => {
  const isOutOfStock = max === 0;

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  if (isOutOfStock) {
    return (
      <div className="flex items-center justify-center text-gray-600 font-body text-sm">
        Out of Stock
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value === min}
        className="border border-gray-300 p-2 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Minus size={16} className="text-gray-700" />
      </button>

      <div className="border-t border-b border-gray-300 w-12 flex items-center justify-center font-body text-sm py-2">
        {value}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value === max}
        className="border border-gray-300 p-2 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={16} className="text-gray-700" />
      </button>
    </div>
  );
};

export default QuantitySelector;
