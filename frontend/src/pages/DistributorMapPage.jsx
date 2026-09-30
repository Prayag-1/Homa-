import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ExternalLink, MapPin, Phone, Mail, User } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AddressMapPicker } from '../components/shared';
import { useDistributors } from '../hooks/useDistributor';
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsSearchUrl,
  getDistributorMapQuery,
} from '../utils/maps';

function getDetailLine(distributor) {
  return [
    distributor.address,
    distributor.coverageArea,
  ]
    .filter(Boolean)
    .join(' - ');
}

export default function DistributorMapPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: distributors = [], isLoading, isError } = useDistributors();

  const distributor = useMemo(
    () => distributors.find((item) => item.id === id) || null,
    [distributors, id],
  );

  const mapQuery = useMemo(() => getDistributorMapQuery(distributor || {}), [distributor]);
  const directionsUrl = buildGoogleMapsDirectionsUrl(mapQuery);
  const searchUrl = buildGoogleMapsSearchUrl(mapQuery);

  if (!isLoading && !isError && !distributor) {
    return <Navigate to="/distributors" replace />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8f1_0%,#f7efe7_42%,#fffdf9_100%)]">
      <Helmet>
        <title>{distributor ? `${distributor.name} | Dealer Map` : 'Dealer Map | Homa'}</title>
        <meta
          name="description"
          content="Large map view for a Homa authorized distributor with directions."
        />
      </Helmet>

      <section className="border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black hover:text-white"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-black/10 bg-white/85 p-7 shadow-sm">
              <p className="text-xs uppercase tracking-[0.35em] text-black/45">Dealer map</p>
              <h1 className="mt-4 font-heading text-4xl leading-tight text-black md:text-6xl">
                {distributor?.name || 'Distributor not found'}
              </h1>
              {distributor && (
                <>
                  <p className="mt-5 text-base leading-7 text-black/65">
                    {getDetailLine(distributor) || 'Map location preview for this distributor.'}
                  </p>

                  <div className="mt-7 space-y-4 text-sm text-black/75">
                    {distributor.representative && (
                      <div className="flex items-start gap-3">
                        <User size={16} className="mt-0.5 shrink-0 text-black/45" />
                        <span>{distributor.representative}</span>
                      </div>
                    )}
                    {distributor.phone && (
                      <div className="flex items-start gap-3">
                        <Phone size={16} className="mt-0.5 shrink-0 text-black/45" />
                        <span>{distributor.phone}</span>
                      </div>
                    )}
                    {distributor.email && (
                      <div className="flex items-start gap-3">
                        <Mail size={16} className="mt-0.5 shrink-0 text-black/45" />
                        <span className="break-all">{distributor.email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-black/45" />
                      <span>{mapQuery}</span>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/85"
                    >
                      Get directions
                      <ExternalLink size={15} />
                    </a>
                    <a
                      href={searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black hover:text-white"
                    >
                      Open in Maps
                      <ExternalLink size={15} />
                    </a>
                    <Link
                      to="/distributors"
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black hover:text-white"
                    >
                      Back to list
                    </Link>
                  </div>
                </>
              )}
            </div>

            <AddressMapPicker
              address={mapQuery}
              title="Big map view"
              description="Use the buttons to open turn-by-turn directions or view the dealer in Google Maps."
              variant="light"
              mapHeightClass="h-[34rem] md:h-[42rem]"
              className="shadow-[0_24px_80px_rgba(26,20,16,0.12)]"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
