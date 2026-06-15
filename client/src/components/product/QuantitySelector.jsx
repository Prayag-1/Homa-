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
      <div className="flex items-center justify-center font-body text-sm text-homa-grey">
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
        className="border border-[#E0D8D8] bg-white p-2 transition-colors hover:border-homa-red hover:bg-homa-blush disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Minus size={16} className="text-homa-black" />
      </button>

      <div className="flex w-12 items-center justify-center border-b border-t border-[#E0D8D8] py-2 font-heading text-lg text-homa-black">
        {value}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value === max}
        className="border border-[#E0D8D8] bg-white p-2 transition-colors hover:border-homa-red hover:bg-homa-blush disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={16} className="text-homa-black" />
      </button>
    </div>
  );
};

export default QuantitySelector;
