import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Mail, MapPin, Phone, RefreshCw, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AddressMapPicker, Pagination, SearchBar } from '../components/shared';
import { useDistributors } from '../hooks/useDistributor';
import { buildGoogleMapsDirectionsUrl, getDistributorMapQuery } from '../utils/maps';

const formatPhone = (value = '') => value.replace(/\s+/g, '');
const PAGE_SIZE = 6;

function DistributorSkeleton() {
  return (
    <article className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
      <div className="h-4 w-28 animate-pulse bg-black/10" />
      <div className="mt-3 h-3 w-2/3 animate-pulse bg-black/10" />
      <div className="mt-2 h-3 w-full animate-pulse bg-black/10" />
      <div className="mt-2 h-3 w-5/6 animate-pulse bg-black/10" />
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-20 animate-pulse rounded-full bg-black/10" />
        <div className="h-8 w-20 animate-pulse rounded-full bg-black/10" />
      </div>
    </article>
  );
}

export default function Distributors() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  const { data: distributors = [], isLoading, isError, error, refetch } = useDistributors();

  const filteredDistributors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return distributors;

    return distributors.filter((item) => {
      const haystack = [
        item.name,
        item.address,
        item.coverageArea,
        item.representative,
        item.phone,
        item.email,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [distributors, search]);

  const hasFilters = Boolean(search.trim());
  const totalPages = Math.max(Math.ceil(filteredDistributors.length / PAGE_SIZE), 1);
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const visibleDistributors = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredDistributors.slice(start, start + PAGE_SIZE);
  }, [filteredDistributors, safePage]);

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (!visibleDistributors.length) return;
    if (!visibleDistributors.some((item) => item.id === selectedDistributorId)) {
      setSelectedDistributorId(visibleDistributors[0].id);
    }
  }, [selectedDistributorId, visibleDistributors]);

  const selectedDistributor =
    visibleDistributors.find((item) => item.id === selectedDistributorId) ||
    visibleDistributors[0] ||
    null;

  const selectedLocation = getDistributorMapQuery(selectedDistributor || {});
  const directionsUrl = buildGoogleMapsDirectionsUrl(selectedLocation);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8f1_0%,#f7efe7_42%,#fffdf9_100%)]">
      <Helmet>
        <title>Authorized Dealers | Homa</title>
        <meta
          name="description"
          content="Find verified Homa authorized dealers, their coverage areas, and contact details."
        />
      </Helmet>

      <section className="border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <p className="text-xs uppercase tracking-[0.35em] text-black/45">Authorized Dealers</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-black md:text-6xl">
            Find a trusted distributor near you.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-black/65 md:text-base">
            Homa&apos;s authorized dealers help customers buy locally with confidence. Each listing includes
            contact details, coverage, and a named representative where available.
          </p>

          <div className="mt-8 max-w-2xl">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by dealer, area, phone, or representative"
              inputClassName="!font-body"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        {!isError && !isLoading && filteredDistributors.length > 0 && (
          <div className="mb-8 rounded-[1.75rem] border border-black/10 bg-white/85 p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-black/45">Map preview</p>
                    <h2 className="mt-2 text-2xl font-semibold text-black">
                      {selectedDistributor?.name || 'Select a dealer'}
                    </h2>
                  </div>
                  <Link
                    to={selectedDistributor ? `/distributors/${selectedDistributor.id}/map` : '/distributors'}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black hover:text-white"
                  >
                    Open big map
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <AddressMapPicker
                  address={selectedLocation}
                  title="Selected dealer map"
                  description="Choose a dealer from the list below to update this map."
                  variant="light"
                  mapHeightClass="h-[18rem]"
                  className="shadow-none"
                />
              </div>

              {selectedDistributor && (
                <div className="w-full max-w-sm rounded-[1.5rem] border border-black/10 bg-black/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-black/45">Dealer details</p>
                  <h3 className="mt-2 text-lg font-semibold text-black">{selectedDistributor.name}</h3>
                  <div className="mt-3 space-y-2 text-sm text-black/70">
                    {selectedDistributor.representative && (
                      <div className="flex items-start gap-2">
                        <User size={14} className="mt-0.5 shrink-0 text-black/45" />
                        <span>{selectedDistributor.representative}</span>
                      </div>
                    )}
                    {selectedDistributor.phone && (
                      <div className="flex items-start gap-2">
                        <Phone size={14} className="mt-0.5 shrink-0 text-black/45" />
                        <span>{selectedDistributor.phone}</span>
                      </div>
                    )}
                    {selectedDistributor.email && (
                      <div className="flex items-start gap-2">
                        <Mail size={14} className="mt-0.5 shrink-0 text-black/45" />
                        <span className="break-all">{selectedDistributor.email}</span>
                      </div>
                    )}
                  </div>
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/85"
                  >
                    Get directions
                    <ArrowRight size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {isError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">
                {error?.response?.data?.message || error?.message || 'Something went wrong while loading dealers.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/90"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          </div>
        )}

        {!isError && isLoading && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <DistributorSkeleton key={`dealer-skeleton-${index}`} />
            ))}
          </div>
        )}

        {!isError && !isLoading && filteredDistributors.length === 0 && (
          <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-[2rem] border border-black/10 bg-white/80 px-6 py-16 text-center shadow-sm">
            <h2 className="font-display text-3xl text-black">No dealers found</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-black/65">
              Try a different search term or clear the current filter.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-black underline underline-offset-4 transition-colors hover:text-red-600"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {!isError && filteredDistributors.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.22em] text-black/45">Dealers</p>
                <p className="text-xs text-black/55">
                  Page {safePage} of {totalPages}
                </p>
              </div>

              <div className="grid gap-3">
                {visibleDistributors.map((dealer) => (
                  <article
                    key={dealer.id}
                    className={`group rounded-2xl border bg-white/85 p-4 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                      selectedDistributor?.id === dealer.id
                        ? 'border-red-300 ring-1 ring-red-200'
                        : 'border-black/10'
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDistributorId(dealer.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedDistributorId(dealer.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold leading-tight text-black transition-colors group-hover:text-red-600">
                          {dealer.name}
                        </h2>
                        <p className="mt-1 text-sm text-black/60">
                          {dealer.coverageArea || dealer.address || 'Location not listed'}
                        </p>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5">
                        <User size={16} className="text-black/60" />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-black/70">
                      {dealer.phone && (
                        <a
                          href={`tel:${formatPhone(dealer.phone)}`}
                          className="inline-flex items-center gap-2 rounded-full border border-black/15 px-3 py-1.5 transition hover:bg-black hover:text-white"
                        >
                          <Phone size={14} />
                          Call
                        </a>
                      )}
                      {dealer.email && (
                        <a
                          href={`mailto:${dealer.email}`}
                          className="inline-flex items-center gap-2 rounded-full border border-black/15 px-3 py-1.5 transition hover:bg-black hover:text-white"
                        >
                          <Mail size={14} />
                          Email
                        </a>
                      )}
                      <Link
                        to={`/distributors/${dealer.id}/map`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-2 rounded-full border border-black/15 px-3 py-1.5 transition hover:bg-black hover:text-white"
                      >
                        View on map
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="pt-2">
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={(nextPage) => {
                    setCurrentPage(nextPage);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="justify-center"
                  buttonClassName="rounded-full"
                />
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
