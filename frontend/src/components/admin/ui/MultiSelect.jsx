export default function MultiSelect({
  options = [],
  value = [],
  onChange,
  label,
  error,
}) {
  const selectedValues = Array.isArray(value) ? value : [];

  const toggleOption = (option) => {
    const nextValue = selectedValues.includes(option)
      ? selectedValues.filter((item) => item !== option)
      : [...selectedValues, option];
    onChange(nextValue);
  };

  return (
    <div>
      {label && (
        <div className="admin-field-label">
          {label}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = selectedValues.includes(option);
          return (
            <button
              key={option}
              type="button"
              className={`admin-pill ${selected ? 'admin-pill-selected' : ''}`}
              onClick={() => toggleOption(option)}
              aria-pressed={selected}
            >
              {option}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
        {selectedValues.length} selected
      </div>
      {error && <p className="admin-field-error">{error}</p>}
    </div>
  );
}
