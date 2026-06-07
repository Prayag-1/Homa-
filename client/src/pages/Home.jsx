import { Link } from 'react-router-dom';

const featuredCategories = [
  { title: 'Cleansers', description: 'Gentle daily wash formulas for fresh skin.' },
  { title: 'Serums', description: 'Targeted care for glow, hydration, and repair.' },
  { title: 'Sunscreens', description: 'Lightweight UV protection for every day.' },
  { title: 'Moisturizers', description: 'Barrier support and long-lasting hydration.' },
];

const dealCards = [
  { title: 'Brightening Starter Set', price: 'Rs. 2,450', note: 'Best for beginners' },
  { title: 'Hydration Duo', price: 'Rs. 1,980', note: 'Daily moisture boost' },
  { title: 'Sun Care Essentials', price: 'Rs. 1,250', note: 'SPF protection' },
];

const benefits = [
  'Authentic Japanese beauty products',
  'Fast delivery across Nepal',
  'Simple routines for everyday use',
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff6ea_0%,#f7eee6_40%,#fffdf9_100%)]">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div className="rounded-[2.25rem] border border-black/10 bg-white/80 p-8 shadow-[0_24px_80px_rgba(26,20,16,0.10)] backdrop-blur md:p-12">
          <p className="text-sm uppercase tracking-[0.35em] text-black/45">Homa Nepal</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight md:text-7xl">
            Japanese beauty, curated for Nepal.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-black/70 md:text-lg">
            Discover clean, effective skincare and beauty essentials inspired by Japanese routines.
            Homa Nepal brings a simple ecommerce experience with products built for everyday use,
            brighter skin, and a calmer routine.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/shop" className="rounded-full bg-black px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-black/85">
              Shop now
            </Link>
            <Link to="/register" className="rounded-full border border-black/15 px-6 py-3 text-center text-sm font-medium text-black transition hover:bg-black/5">
              Create account
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {benefits.map((item) => (
              <div key={item} className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm text-black/75">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[2rem] border border-black/10 bg-[#18120f] p-7 text-white shadow-[0_20px_60px_rgba(26,20,16,0.18)]">
            <p className="text-xs uppercase tracking-[0.35em] text-white/55">Featured deal</p>
            <h2 className="mt-4 text-3xl font-semibold">Glow routine bundle</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              A simple, beginner-friendly skincare bundle with cleanser, serum, and moisturizer.
            </p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-2xl font-semibold">Rs. 3,490</span>
              <button className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
                Add to cart
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white/80 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-black/45">Why Homa Nepal</p>
            <h2 className="mt-3 text-2xl font-semibold">Simple, premium, practical</h2>
            <p className="mt-3 text-sm leading-6 text-black/70">
              A storefront designed for easy browsing, clean product discovery, and a polished shopping feel
              without requiring sign-in.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-8 md:p-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-black/45">Categories</p>
              <h2 className="mt-2 text-3xl font-semibold">Shop by category</h2>
            </div>
            <Link to="/shop" className="text-sm font-medium text-black underline underline-offset-4">
              Browse all
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredCategories.map((item) => (
              <article key={item.title} className="rounded-[1.5rem] border border-black/10 bg-[linear-gradient(180deg,#fff_0%,#fbf4ef_100%)] p-5">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/65">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-black/10 bg-[#f4ece4] p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-black/45">New arrivals</p>
            <h2 className="mt-3 text-3xl font-semibold">Latest deals</h2>
            <p className="mt-3 text-sm leading-6 text-black/70">
              Dummy ecommerce content you can later connect to real product data, promotions, or collections.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {dealCards.map((deal) => (
              <article key={deal.title} className="rounded-[1.5rem] border border-black/10 bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-black/45">{deal.note}</p>
                <h3 className="mt-3 text-xl font-semibold">{deal.title}</h3>
                <p className="mt-4 text-sm font-medium text-black/65">{deal.price}</p>
                <button className="mt-5 rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black hover:text-white">
                  View deal
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
