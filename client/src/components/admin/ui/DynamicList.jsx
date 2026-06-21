import { X } from 'lucide-react';
import { useState } from 'react';

export default function DynamicList({
  value = [],
  onChange,
  label,
  placeholder,
  maxItems = 20,
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const items = Array.isArray(value) ? value : [];
  const isMaxed = items.length >= maxItems;

  const addItem = () => {
    const nextItem = input.trim();
    setError('');

    if (!nextItem) return;
    if (items.some((item) => item.toLowerCase() === nextItem.toLowerCase())) {
      setError('This item is already listed.');
      return;
    }
    if (isMaxed) {
      setError(`Maximum ${maxItems} items allowed.`);
      return;
    }

    onChange([...items, nextItem]);
    setInput('');
  };

  const removeItem = (index) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
    setError('');
  };

  return (
    <div>
      {label && <div className="admin-field-label">{label}</div>}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="admin-list-row">
            <span className="min-w-0 flex-1 truncate text-sm">{item}</span>
            <button
              type="button"
              className="admin-icon-button admin-button"
              onClick={() => removeItem(index)}
              title="Remove"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          className="admin-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder}
          disabled={isMaxed}
        />
        <button
          type="button"
          className="admin-button sm:w-auto"
          onClick={addItem}
          disabled={isMaxed}
        >
          Add
        </button>
      </div>
      <div className="mt-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
        {items.length}/{maxItems}
      </div>
      {error && <p className="admin-field-error">{error}</p>}
    </div>
  );
}
