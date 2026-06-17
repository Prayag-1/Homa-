import { Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';
import { useBestSellers, useNewArrivals } from '../hooks/useProducts';

const attributes = ['Skin Health', 'Transformation', 'Beauty', 'Feminine', 'Japanese', 'Luxury'];

const stats = [
  { value: '100%', label: 'Authentic imports' },
  { value: '77+', label: 'Districts served' },
  { value: '4.9', label: 'Customer rating' },
];

const testimonials = [
  { quote: 'My routine finally feels simple, premium, and consistent.', name: 'Aarati Shrestha' },
  { quote: 'The textures are light, elegant, and perfect for daily use.', name: 'Mina Gurung' },
  { quote: 'HOMA made Japanese skincare easy to discover in Nepal.', name: 'Priya Thapa' },
];

function SectionHeader({ label, title, light = false }) {
  return (
    <div className="mb-8">
      <p className={`font-body text-[11px] font-bold uppercase tracking-[0.22em] ${light ? 'text-white/70' : 'text-homa-red'}`}>
        {label}
      </p>
      <h2 className={`mt-3 font-heading text-4xl font-semibold leading-tight ${light ? 'text-white' : 'text-homa-black'}`}>
        {title}
      </h2>
    </div>
  );
}

export default function Home() {
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useNewArrivals();
  const { data: bestSellersData, isLoading: bestSellersLoading } = useBestSellers();

  const newArrivals = Array.isArray(newArrivalsData) ? newArrivalsData : newArrivalsData?.items || [];
  const bestSellers = Array.isArray(bestSellersData) ? bestSellersData : bestSellersData?.items || [];

  return (
    <main className="min-h-screen bg-homa-cream">
      <section className="sakura-pattern grid min-h-[85vh] items-center bg-homa-red px-5 py-16 text-white md:px-12 lg:grid-cols-2 lg:py-20">
        <div className="mx-auto w-full max-w-7xl lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
          <div>
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.25em] text-white/70">
              Japanese Health & Beauty Store
            </p>
            <h1 className="mt-5 max-w-2xl font-heading text-[40px] font-semibold leading-[1.1] text-white md:text-[64px]">
              Authentic Japanese Skincare, Delivered to Nepal.
            </h1>
            <p className="mt-4 max-w-xl font-body text-base leading-7 text-white/85">
              Curated skincare, beauty rituals, and trusted essentials for youthful, healthy skin.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="rounded-pill bg-white px-8 py-4 text-center font-body text-sm font-bold uppercase tracking-[0.12em] text-homa-red transition hover:scale-[1.02]"
              >
                Shop Now
              </Link>
              <Link
                to="/skin-quiz"
                className="rounded-pill border-2 border-white px-8 py-4 text-center font-body text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:scale-[1.02] hover:bg-white/10"
              >
                Take Skin Quiz
              </Link>
            </div>
          </div>

          <div className="mt-12 flex justify-center lg:mt-0">
            <div className="relative h-[420px] w-full max-w-md">
              <div className="absolute left-8 top-8 h-72 w-44 rounded-t-[5rem] rounded-b-[2rem] bg-white shadow-[0_28px_80px_rgba(41,40,40,0.25)]" />
              <div className="absolute left-16 top-24 h-40 w-28 rounded-2xl bg-homa-blush" />
              <div className="absolute right-8 top-20 h-80 w-48 rounded-t-[6rem] rounded-b-[2rem] bg-white/95 shadow-[0_28px_80px_rgba(41,40,40,0.22)]" />
              <div className="absolute right-20 top-36 h-32 w-24 rounded-2xl bg-homa-red-light" />
              <div className="absolute bottom-8 left-1/2 h-28 w-60 -translate-x-1/2 rounded-[50%] bg-homa-red-dark/30 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden bg-homa-black py-4 text-white">
        <div className="animate-[marquee_24s_linear_infinite] whitespace-nowrap font-body text-xs font-bold uppercase tracking-[0.15em]">
          Authentic Japanese Products - Delivered Across Nepal - Sugi Pharmacy Certified - Skin Health & Beauty -
          Authentic Japanese Products - Delivered Across Nepal - Sugi Pharmacy Certified - Skin Health & Beauty -
        </div>
      </div>

      <section className="bg-homa-cream px-5 py-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader label="New Arrivals" title="Fresh rituals for everyday skin health" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {newArrivalsLoading
              ? Array.from({ length: 3 }).map((_, index) => <ProductCardSkeleton key={index} />)
              : newArrivals.slice(0, 3).map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
          </div>
        </div>
      </section>

      <section className="bg-homa-blush px-5 py-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader label="Best Sellers" title="Beloved formulas customers return to" />
          <div className="grid gap-5 md:grid-cols-3">
            {bestSellersLoading
              ? Array.from({ length: 3 }).map((_, index) => <ProductCardSkeleton key={index} />)
              : bestSellers.slice(0, 3).map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
          </div>
        </div>
      </section>

      <section className="sakura-pattern bg-homa-red px-5 py-16 text-white md:px-12">
        <div className="mx-auto max-w-7xl text-center">
          <SectionHeader label="Brand Attributes" title="Japanese beauty, modern transformation" light />
          <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
            {attributes.map((attribute) => (
              <span key={attribute} className="rounded-pill bg-homa-red-dark px-6 py-3 font-body text-sm font-bold uppercase tracking-[0.12em] text-white">
                {attribute}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-homa-black px-5 py-14 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 text-center md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-heading text-[64px] font-semibold leading-none text-homa-red">{stat.value}</p>
              <p className="mt-3 font-body text-sm font-bold uppercase tracking-[0.14em] text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-homa-cream px-5 py-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader label="Testimonials" title="Notes from the HOMA community" />
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
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
