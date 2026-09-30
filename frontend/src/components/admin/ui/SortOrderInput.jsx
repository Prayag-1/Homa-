export default function SortOrderInput({ value, onChange, error }) {
  return (
    <div>
      <label className="admin-field-label" htmlFor="sortOrder">Sort Order</label>
      <input
        id="sortOrder"
        type="number"
        min="0"
        max="9999"
        className="admin-input"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="mt-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
        Lower number = shown first
      </div>
      {error && <p className="admin-field-error">{error}</p>}
    </div>
  );
}
