import { Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';
import HeroCarousel from '../components/home/HeroCarousel';
import { usePublicBanners } from '../hooks/useBanners';
import { useBestSellers, useNewArrivals } from '../hooks/useProducts';

const attributes = ['Skin Health', 'Transformation', 'Beauty', 'Feminine', 'Japanese', 'Luxury'];

const stats = [
  { value: '100%', label: 'Authentic imports' },
  { value: '77+', label: 'Districts served' },
  { value: '4.9', label: 'Customer rating' },
];

const testimonials = [
  { quote: 'My routine finally feels simple, premium, and consistent.', name: 'Diya Poudel' },
  { quote: 'The textures are light, elegant, and perfect for daily use.', name: 'Prayag Nepal' },
  { quote: 'HOMA made Japanese skincare easy to discover in Nepal.', name: 'Adarsh Sapkota' },
];

function SectionHeader({ label, title, light = false }) {
  return (
    <div className="mb-8">
      <p className={`font-body text-[11px] font-bold uppercase tracking-[0.22em] ${light ? 'text-white/70' : 'text-homa-red'}`}>
        {label}
      </p>
      <h2 className={`text-h2 mt-3 font-heading font-semibold ${light ? 'text-white' : 'text-homa-black'}`}>
        {title}
      </h2>
    </div>
  );
}

export default function Home() {
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useNewArrivals();
  const { data: bestSellersData, isLoading: bestSellersLoading } = useBestSellers();
  const { data: heroBannersData } = usePublicBanners();

  const newArrivals = Array.isArray(newArrivalsData) ? newArrivalsData : newArrivalsData?.items || [];
  const bestSellers = Array.isArray(bestSellersData) ? bestSellersData : bestSellersData?.items || [];
  const heroBanners = Array.isArray(heroBannersData) ? heroBannersData : [];

  return (
    <main className="min-h-screen bg-homa-cream">
      <section className="sakura-pattern flex min-h-[85vh] flex-col bg-homa-red px-5 py-12 text-white md:min-h-screen md:flex-row md:px-12 md:py-20">
        <div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row md:items-center md:gap-12">
          <div>
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.25em] text-white/70">
              Japanese Health & Beauty Store
            </p>
            <h1 className="text-display mt-5 max-w-2xl font-heading font-semibold text-white">
              Authentic Japanese Skincare, Delivered to Nepal.
            </h1>
            <p className="mt-4 max-w-xl font-body text-base leading-7 text-white/85">
              Curated skincare, beauty rituals, and trusted essentials for youthful, healthy skin.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                to="/shop"
                className="w-full rounded-pill bg-white px-8 py-4 text-center font-body text-sm font-bold uppercase tracking-[0.12em] text-homa-red transition hover:scale-[1.02] sm:w-auto"
              >
                Shop Now
              </Link>
              <Link
                to="/skin-quiz"
                className="w-full rounded-pill border-2 border-white px-8 py-4 text-center font-body text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:scale-[1.02] hover:bg-white/10 sm:w-auto"
              >
                Take Skin Quiz
              </Link>
            </div>
          </div>

          <div className="mt-10 flex justify-center md:mt-0 md:flex-1">
            <HeroCarousel banners={heroBanners} />
          </div>
        </div>
      </section>

      <div className="overflow-hidden bg-homa-black py-4 text-white">
        <div className="animate-[marquee_16s_linear_infinite] whitespace-nowrap font-body text-[10px] font-bold uppercase tracking-[0.15em] md:animate-[marquee_24s_linear_infinite] md:text-xs">
          Authentic Japanese Products - Delivered Across Nepal - Sugi Pharmacy Certified - Skin Health & Beauty -
          Authentic Japanese Products - Delivered Across Nepal - Sugi Pharmacy Certified - Skin Health & Beauty -
        </div>
      </div>

      <section className="bg-homa-cream px-5 py-10 md:px-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeader label="New Arrivals" title="Fresh rituals for everyday skin health" />
          <div className="scroll-x-mobile md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {newArrivalsLoading
              ? Array.from({ length: 3 }).map((_, index) => <ProductCardSkeleton key={index} />)
              : newArrivals.slice(0, 3).map((product) => (
                  <div key={product._id} className="w-[75vw] md:w-auto">
                    <ProductCard product={product} />
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section className="bg-homa-blush px-5 py-10 md:px-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeader label="Best Sellers" title="Beloved formulas customers return to" />
          <div className="scroll-x-mobile md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {bestSellersLoading
              ? Array.from({ length: 3 }).map((_, index) => <ProductCardSkeleton key={index} />)
              : bestSellers.slice(0, 3).map((product) => (
                  <div key={product._id} className="w-[75vw] md:w-auto">
                    <ProductCard product={product} />
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section className="sakura-pattern bg-homa-red px-5 py-16 text-white md:px-12">
        <div className="mx-auto max-w-7xl text-center">
          <SectionHeader label="Brand Attributes" title="Japanese beauty, modern transformation" light />
          <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2 px-4 md:gap-3">
            {attributes.map((attribute) => (
              <span key={attribute} className="rounded-pill bg-homa-red-dark px-4 py-2 font-body text-[11px] font-bold uppercase tracking-[0.12em] text-white md:px-6 md:py-3 md:text-sm">
                {attribute}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-homa-black px-5 py-14 md:px-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 text-center sm:grid-cols-3 sm:gap-4">
          {stats.map((stat, index) => (
            <div key={stat.label} className={index > 0 ? 'border-t border-white/10 pt-8 sm:border-l sm:border-t-0 sm:pt-0' : ''}>
              <p className="text-display font-heading font-semibold text-homa-red">{stat.value}</p>
              <p className="mt-3 font-body text-sm font-bold uppercase tracking-[0.14em] text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-homa-cream px-5 py-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader label="Testimonials" title="Notes from the HOMA community" />
          <div className="scroll-x-mobile md:grid-cols-3 md:gap-5">
            {testimonials.map((item) => (
              <article key={item.name} className="w-[85vw] rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:w-auto">
                <p className="font-heading text-lg italic leading-8 text-homa-black">"{item.quote}"</p>
                <p className="mt-5 font-body text-sm font-bold uppercase tracking-[0.1em] text-homa-red">{item.name}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
