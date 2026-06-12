import { useMemo, useState } from 'react';

const toDateInput = (date) => date.toISOString().split('T')[0];
const today = () => toDateInput(new Date());

const getPresetRange = (preset) => {
  const now = new Date();
  const start = new Date(now);

  if (preset === 'today') return { from: today(), to: today() };
  if (preset === '7d') start.setDate(now.getDate() - 6);
  if (preset === '30d') start.setDate(now.getDate() - 29);
  if (preset === '90d') start.setDate(now.getDate() - 89);
  if (preset === 'year') start.setMonth(0, 1);

  return { from: toDateInput(start), to: today() };
};

const presets = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'year', label: 'This Year' },
];

export default function DateRangePicker({ value, onChange }) {
  const [draft, setDraft] = useState(value);

  const activePreset = useMemo(() => {
    const match = presets.find((preset) => {
      const range = getPresetRange(preset.key);
      return range.from === value.from && range.to === value.to;
    });
    return match?.key;
  }, [value]);

  const validationError = useMemo(() => {
    if (!draft.from || !draft.to) return 'Both dates are required.';
    if (draft.from > draft.to) return 'From date cannot be after to date.';
    if (draft.to > today()) return 'To date cannot be in the future.';
    return '';
  }, [draft]);

  const updateDraft = (key, nextValue) => {
    const next = { ...draft, [key]: nextValue };
    setDraft(next);
    if (next.from && next.to && next.from <= next.to && next.to <= today()) {
      onChange(next);
    }
  };

  const applyPreset = (preset) => {
    const range = getPresetRange(preset);
    setDraft(range);
    onChange(range);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => (
          <button
            key={preset.key}
            className={`admin-pill ${activePreset === preset.key ? 'admin-pill-selected' : ''}`}
            type="button"
            onClick={() => applyPreset(preset.key)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="admin-input w-[150px]"
          type="date"
          value={draft.from}
          max={draft.to || today()}
          onChange={(event) => updateDraft('from', event.target.value)}
        />
        <span style={{ color: 'var(--admin-muted)' }}>-</span>
        <input
          className="admin-input w-[150px]"
          type="date"
          value={draft.to}
          min={draft.from}
          max={today()}
          onChange={(event) => updateDraft('to', event.target.value)}
        />
      </div>
      {validationError && <p className="admin-field-error">{validationError}</p>}
    </div>
  );
}
