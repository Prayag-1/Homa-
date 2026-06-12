const trim = (value) => String(value || '').trim();

export function getDistributorMapQuery(distributor = {}) {
  const address = trim(distributor.address);
  const coverageArea = trim(distributor.coverageArea);
  const name = trim(distributor.name);

  const base = address || coverageArea || name;
  if (!base) return 'Kathmandu, Nepal';

  return /nepal/i.test(base) ? base : `${base}, Nepal`;
}

export function buildGoogleMapsSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trim(query))}`;
}

export function buildGoogleMapsDirectionsUrl(query) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trim(query))}`;
}
