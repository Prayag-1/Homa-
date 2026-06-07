import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const latestDeals = [
  {
    title: 'Brightening Starter Kit',
    tag: 'New',
    price: 'Rs. 2,450',
    meta: 'Cleanser + toner + essence',
  },
  {
    title: 'Barrier Repair Duo',
    tag: 'Hot',
    price: 'Rs. 1,980',
    meta: 'Moisturizer + repair serum',
  },
  {
    title: 'Sun Shield SPF50',
    tag: 'Limited',
    price: 'Rs. 1,250',
    meta: 'Daily UV protection',
  },
];

const quickCategories = [
  'Cleansers',
  'Serums',
  'Moisturizers',
  'Sunscreens',
  'Masks',
  'Toners',
];

const highlights = [
  { title: 'Authentic Imports', value: 'Japan-sourced beauty essentials' },
  { title: 'Fast Delivery', value: 'Kathmandu and major cities' },
  { title: 'Skin-friendly', value: 'Simple routines for daily use' },
];

export default function Dashboard() {
  const { user } = useAuth();

  const displayName = user?.name || 'there';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff4e8_0%,#f7efe8_38%,#fffdf9_100%)]">
      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-black/10 bg-white/80 p-8 shadow-[0_24px_80px_rgba(26,20,16,0.10)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.35em] text-black/45">User dashboard</p>
            <h1 className="mt-4 font-display text-4xl leading-tight md:text-6xl">
              Welcome to Homa Nepal, {displayName}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-black/70 md:text-lg">
              Homa Nepal brings carefully selected Japanese beauty products to your routine.
              The focus is simple skincare, reliable quality, and products that fit everyday use
              for Nepalese customers who want a cleaner, more consistent beauty routine.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-black/10 bg-black/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-black/45">{item.title}</p>
                  <p className="mt-2 text-sm font-medium text-black/80">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/shop" className="rounded-full bg-black px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-black/85">
                Explore products
              </Link>
              <Link to="/user/dashboard" className="rounded-full border border-black/15 px-6 py-3 text-center text-sm font-medium text-black transition hover:bg-black/5">
                View dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-black/10 bg-[#18120f] p-7 text-white shadow-[0_20px_60px_rgba(26,20,16,0.18)]">
              <p className="text-xs uppercase tracking-[0.35em] text-white/55">Today</p>
              <h2 className="mt-4 text-3xl font-semibold">Latest deals</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Dummy ecommerce content for a typical dashboard. Replace these cards with live
                promotions, inventory, or recommendations later.
              </p>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-white/80 p-6">
              <p className="text-sm font-medium text-black/60">Your quick stats</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-[#f8ede4] p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-black/45">Orders</p>
                  <p className="mt-2 text-2xl font-semibold">12</p>
                </div>
                <div className="rounded-2xl bg-[#eef4ef] p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-black/45">Points</p>
                  <p className="mt-2 text-2xl font-semibold">480</p>
                </div>
                <div className="rounded-2xl bg-[#f1eef8] p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-black/45">Saved</p>
                  <p className="mt-2 text-2xl font-semibold">7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-black/10 bg-white/80 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-black/45">Shop by category</p>
            <h2 className="mt-3 text-3xl font-semibold">Typical ecommerce sections</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {quickCategories.map((item) => (
                <div key={item} className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-medium">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white/80 p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-black/45">Latest deals</p>
                <h2 className="mt-3 text-3xl font-semibold">Fresh offers for you</h2>
              </div>
              <Link to="/shop" className="text-sm font-medium text-black underline underline-offset-4">
                See all
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {latestDeals.map((deal) => (
                <article key={deal.title} className="rounded-[1.5rem] border border-black/10 bg-[linear-gradient(180deg,#fff_0%,#fbf4ef_100%)] p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white">
                      {deal.tag}
                    </span>
                    <span className="text-sm font-semibold text-black/60">{deal.price}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{deal.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-black/65">{deal.meta}</p>
                  <button className="mt-5 rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black hover:text-white">
                    Add to cart
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
