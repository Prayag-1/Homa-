import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Mail, MapPin, Phone, RefreshCw, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/shared';
import { useDistributors } from '../hooks/useDistributor';

const formatPhone = (value = '') => value.replace(/\s+/g, '');

function DistributorSkeleton() {
  return (
    <article className="rounded-[1.75rem] border border-black/10 bg-white/80 p-6 shadow-sm">
      <div className="h-5 w-28 animate-pulse bg-black/10" />
      <div className="mt-4 h-4 w-2/3 animate-pulse bg-black/10" />
      <div className="mt-3 h-4 w-full animate-pulse bg-black/10" />
      <div className="mt-2 h-4 w-5/6 animate-pulse bg-black/10" />
      <div className="mt-5 flex gap-2">
        <div className="h-9 w-24 animate-pulse rounded-full bg-black/10" />
        <div className="h-9 w-24 animate-pulse rounded-full bg-black/10" />
      </div>
    </article>
  );
}

export default function Distributors() {
  const [search, setSearch] = useState('');
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
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.35em] text-black/45">Authorized Dealers</p>
          <h1 className="mt-4 font-display text-5xl leading-tight text-black md:text-7xl">
            Find a trusted distributor near you.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-black/65 md:text-lg">
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

      <section className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.28em] text-black/45">
            <MapPin size={15} />
            Verified network
          </div>
          <div className="text-sm text-black/55">
            {filteredDistributors.length} dealer{filteredDistributors.length === 1 ? '' : 's'} listed
          </div>
        </div>

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
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredDistributors.map((dealer) => (
              <article
                key={dealer.id}
                className="group rounded-[1.75rem] border border-black/10 bg-white/85 p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
                      Authorized dealer
                    </span>
                    <h2 className="mt-4 font-display text-2xl leading-tight text-black transition-colors group-hover:text-red-600">
                      {dealer.name}
                    </h2>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-black/5">
                    <User size={18} className="text-black/60" />
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm text-black/70">
                  {dealer.coverageArea && (
                    <div className="flex items-start gap-2">
                      <MapPin size={15} className="mt-0.5 shrink-0 text-black/45" />
                      <span>{dealer.coverageArea}</span>
                    </div>
                  )}
                  {dealer.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={15} className="mt-0.5 shrink-0 text-black/45" />
                      <span>{dealer.address}</span>
                    </div>
                  )}
                  {dealer.representative && (
                    <div className="flex items-start gap-2">
                      <User size={15} className="mt-0.5 shrink-0 text-black/45" />
                      <span>{dealer.representative}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-3 border-t border-black/10 pt-5 text-sm">
                  {dealer.phone && (
                    <a
                      href={`tel:${formatPhone(dealer.phone)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 font-medium text-black transition hover:bg-black hover:text-white"
                    >
                      <Phone size={15} />
                      {dealer.phone}
                    </a>
                  )}
                  {dealer.email && (
                    <a
                      href={`mailto:${dealer.email}`}
                      className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 font-medium text-black transition hover:bg-black hover:text-white"
                    >
                      <Mail size={15} />
                      Email dealer
                    </a>
                  )}
                  {!dealer.phone && !dealer.email && (
                    <span className="text-sm text-black/55">Contact details not listed.</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,#18120f_0%,#2b201b_100%)] p-8 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/55">Need help</p>
              <h2 className="mt-3 text-3xl font-semibold">Talk to us if you need the closest stockist.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                We&apos;re happy to point you toward the right dealer based on your location or the type of
                product you&apos;re looking for.
              </p>
            </div>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
            >
              About Homa
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
