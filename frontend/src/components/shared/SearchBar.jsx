import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  isLoading = false,
  className = '',
  inputClassName = '',
  iconClassName = '',
  spinnerClassName = '',
}) {
  const [inputValue, setInputValue] = useState(value ?? '');
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const scheduleChange = (nextValue) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (debounceMs <= 0) {
      onChangeRef.current(nextValue);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      onChangeRef.current(nextValue);
    }, debounceMs);
  };

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    scheduleChange(nextValue);
  };

  const handleClear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setInputValue('');
    onChangeRef.current('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <Search
        size={16}
        className={`pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-black/50 ${iconClassName}`}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-0 py-2 pl-7 pr-10 border-0 border-b-2 border-black focus:outline-none focus:border-red-500 transition-colors bg-transparent ${className} ${inputClassName}`}
      />
      <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {isLoading && (
          <span className={`inline-flex h-4 w-4 items-center justify-center text-black/50 ${spinnerClassName}`} aria-hidden="true">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </span>
        )}
        {inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-5 w-5 items-center justify-center text-black/60 transition-colors hover:text-black"
            aria-label="Clear search"
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
