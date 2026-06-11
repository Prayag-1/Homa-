import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [27.7172, 85.324];

const pinIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 9999px;
      background: #dc2626;
      border: 3px solid rgba(255,255,255,0.95);
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 14, { animate: true });
    }
  }, [map, position]);

  return null;
}

function toLabel(result) {
  const parts = [
    result?.address?.house_number,
    result?.address?.road,
    result?.address?.neighbourhood,
    result?.address?.suburb,
    result?.address?.city || result?.address?.town || result?.address?.village,
    result?.address?.state,
    result?.address?.country,
  ].filter(Boolean);

  return parts.join(', ') || result?.display_name || '';
}

function toAddressFields(result) {
  const line1Parts = [result?.address?.house_number, result?.address?.road].filter(Boolean);
  const line2Parts = [
    result?.address?.neighbourhood,
    result?.address?.suburb,
    result?.address?.hamlet,
  ].filter(Boolean);

  return {
    line1: line1Parts.join(' '),
    line2: line2Parts.join(', '),
    city:
      result?.address?.city ||
      result?.address?.town ||
      result?.address?.village ||
      result?.address?.municipality ||
      result?.address?.district ||
      result?.address?.county ||
      '',
    state: result?.address?.state || result?.address?.state_district || '',
    postalCode: result?.address?.postcode || '',
    country: result?.address?.country || '',
  };
}

export default function AddressMapPicker({
  address = '',
  onAddressSelect,
  onLocationSelect,
  title = 'Address map',
  description = 'Leaflet previews the location that matches the address you entered.',
  editable = false,
  variant = 'light',
  mapHeightClass = 'h-64',
  className = '',
}) {
  const [query, setQuery] = useState(address);
  const [position, setPosition] = useState(null);
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    setQuery(address);
  }, [address]);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 8) {
      setPosition(null);
      setLabel('');
      setStatus('idle');
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      setStatus('loading');
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(trimmed)}`;
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) throw new Error('Unable to locate this address.');

        const results = await response.json();
        if (!Array.isArray(results) || results.length === 0) {
          setPosition(null);
          setLabel('No map result found for this address.');
          setStatus('idle');
          return;
        }

        const result = results[0];
        const nextPosition = [Number(result.lat), Number(result.lon)];
        setPosition(nextPosition);
        setLabel(result.display_name || trimmed);
        setStatus('idle');
      } catch (error) {
        setPosition(null);
        setLabel(error?.message || 'Map lookup failed.');
        setStatus('error');
      }
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const center = useMemo(() => position || DEFAULT_CENTER, [position]);

  const handleMapClick = async (event) => {
    if (!editable) return;

    const { lat, lng } = event.latlng;
    setPosition([lat, lng]);
    setStatus('loading');

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) throw new Error('Unable to resolve the selected location.');

      const result = await response.json();
      const nextLabel = toLabel(result) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      const nextAddress = toAddressFields(result);
      setLabel(nextLabel);
      setQuery(nextLabel);
      onAddressSelect?.(nextLabel);
      onLocationSelect?.({
        label: nextLabel,
        address: nextAddress,
        position: [lat, lng],
        raw: result,
      });
      setStatus('idle');
    } catch (error) {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setLabel(error?.message || 'Location selected.');
      setQuery(fallback);
      onAddressSelect?.(fallback);
      onLocationSelect?.({
        label: fallback,
        address: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
        position: [lat, lng],
        raw: null,
      });
      setStatus('error');
    }
  };

  const isDark = variant === 'dark';
  const shellClass = isDark
    ? 'border-[#2d3148] bg-[#1f2232] text-[var(--admin-text)]'
    : 'border-black/10 bg-white/85 text-black shadow-sm backdrop-blur';
  const mutedClass = isDark ? 'text-[var(--admin-muted)]' : 'text-black/45';
  const descriptionClass = isDark ? 'text-[var(--admin-muted)]' : 'text-black/65';
  const locationClass = isDark ? 'text-[var(--admin-text)]' : 'text-black/75';
  const buttonClass = isDark
    ? 'border-[var(--admin-border)] bg-[#171A25] text-[var(--admin-text)] hover:bg-[#24283A]'
    : 'border-black/10 bg-black text-white hover:bg-black/85';

  return (
    <section
      className={`leaflet-map-card leaflet-map-card--${variant} w-full min-w-0 overflow-hidden rounded-[2rem] border p-5 md:p-6 ${shellClass} ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.28em] ${mutedClass}`}>Leaflet map</p>
          <h3 className={`mt-2 text-lg font-semibold ${isDark ? 'text-[var(--admin-text)]' : 'text-black'}`}>{title}</h3>
          <p className={`mt-2 text-sm leading-6 ${descriptionClass}`}>{description}</p>
        </div>
        {editable && (
          <div className={`text-right text-xs ${mutedClass}`}>
            Click the map to refine the location
          </div>
        )}
      </div>

      <div className="mt-4 min-w-0 overflow-hidden rounded-[1.25rem] border border-black/10">
        <MapContainer center={center} zoom={position ? 14 : 11} scrollWheelZoom className={`w-full max-w-full ${mapHeightClass}`}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && <Marker position={position} icon={pinIcon}><Popup>{label || 'Selected location'}</Popup></Marker>}
          <MapCenter position={position} />
          {editable && <ClickHandler onClick={handleMapClick} />}
        </MapContainer>
      </div>

      <div className="mt-3 flex flex-col gap-3 text-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className={`text-xs uppercase tracking-[0.2em] ${mutedClass}`}>Resolved location</p>
          <p className={`mt-1 truncate ${locationClass}`}>
            {status === 'loading'
              ? 'Locating address...'
              : label || 'Enter an address to preview it on the map.'}
          </p>
        </div>
        {editable && onAddressSelect && (
          <button
            type="button"
            className={`w-full whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition sm:w-auto ${buttonClass}`}
            onClick={() => {
              if (label) onAddressSelect(label);
            }}
            disabled={!label || status === 'loading'}
          >
            Use this location
          </button>
        )}
      </div>
    </section>
  );
}

function ClickHandler({ onClick }) {
  const map = useMap();

  useEffect(() => {
    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
    };
  }, [map, onClick]);

  return null;
}
