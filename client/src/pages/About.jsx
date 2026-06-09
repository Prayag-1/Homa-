import { Helmet } from 'react-helmet-async';
import { ArrowRight, BadgeCheck, HeartHandshake, MapPin, ShieldCheck, Sparkles, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const principles = [
  {
    icon: Sparkles,
    title: 'Curated selection',
    description: 'We keep the assortment focused so customers can browse with less noise and more confidence.',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted sourcing',
    description: 'Our product flow and dealer network are designed around verified supply and clear attribution.',
  },
  {
    icon: HeartHandshake,
    title: 'Responsive support',
    description: 'We build for customers who want answers quickly, from product guidance to after-sales help.',
  },
];

const metrics = [
  { label: 'Routine-first', value: 'Simple' },
  { label: 'Dealer network', value: 'Verified' },
  { label: 'Support style', value: 'Local' },
];

const storyHighlights = [
  {
    icon: Layers3,
    title: 'Real before-and-after results',
    description: 'See how simple routines translated into visible improvements for real customers.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified routines',
    description: 'Each story is paired with the routine context so the result is useful, not just visual.',
  },
  {
    icon: Sparkles,
    title: 'Confidence building',
    description: 'The story page gives shoppers proof, not just promises, before they buy.',
  },
];

export default function About() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8f1_0%,#f7efe7_42%,#fffdf9_100%)]">
      <Helmet>
        <title>About Homa | Homa</title>
        <meta
          name="description"
          content="Learn about Homa, our skincare philosophy, and our authorized dealer network across Nepal."
        />
      </Helmet>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2.25rem] border border-black/10 bg-white/80 p-8 shadow-[0_24px_80px_rgba(26,20,16,0.10)] backdrop-blur md:p-12">
            <p className="text-sm uppercase tracking-[0.35em] text-black/45">About Homa</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight md:text-7xl">
              Curated skincare, built for confident everyday use.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-black/70 md:text-lg">
              Homa focuses on practical routines, dependable products, and a verified dealer network so
              customers in Nepal can discover and buy with less friction.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/shop" className="rounded-full bg-black px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-black/85">
                Shop products
              </Link>
              <Link to="/distributors" className="rounded-full border border-black/15 px-6 py-3 text-center text-sm font-medium text-black transition hover:bg-black/5">
                View dealers
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {metrics.map((item) => (
                <div key={item.label} className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-black/45">{item.label}</p>
                  <p className="mt-2 text-sm font-medium text-black/80">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,#18120f_0%,#2b201b_100%)] p-7 text-white shadow-[0_20px_60px_rgba(26,20,16,0.18)]">
              <p className="text-xs uppercase tracking-[0.35em] text-white/55">Our approach</p>
              <h2 className="mt-4 text-3xl font-semibold">Less clutter, more intention.</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Every page, product story, and partner touchpoint is meant to reduce friction and make the
                customer journey feel calm and predictable.
              </p>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-white/80 p-6">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.28em] text-black/45">
                <BadgeCheck size={16} />
                Authorized dealers
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-black">Verified stockists across Nepal.</h3>
              <p className="mt-3 text-sm leading-6 text-black/70">
                Our dealer list is the place to find trusted partners, coverage areas, and contact details
                for customers looking to buy locally.
              </p>
              <Link
                to="/distributors"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-black underline underline-offset-4 transition-colors hover:text-red-600"
              >
                View authorized dealers
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,#f5ede3_0%,#ffffff_100%)] p-6">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.28em] text-black/45">
                <Sparkles size={16} />
                Transformation stories
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-black">See real skin progress, not just product photos.</h3>
              <p className="mt-3 text-sm leading-6 text-black/70">
                The transformation section features before and after stories from customers who saw visible changes with a steady routine.
              </p>
              <Link
                to="/transformations"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-black underline underline-offset-4 transition-colors hover:text-red-600"
              >
                View transformation stories
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-8 md:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-black/45">What we value</p>
              <h2 className="mt-2 text-3xl font-semibold">A straightforward standard for the brand.</h2>
            </div>
            <Link to="/distributors" className="inline-flex items-center gap-2 text-sm font-medium text-black underline underline-offset-4">
              Find a dealer
              <MapPin size={15} />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {principles.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[1.5rem] border border-black/10 bg-[linear-gradient(180deg,#fff_0%,#fbf4ef_100%)] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-black/5">
                    <Icon size={18} className="text-black/70" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-black/65">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-8 md:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-black/45">Transformation stories</p>
              <h2 className="mt-2 text-3xl font-semibold">Proof, context, and customer trust in one place.</h2>
            </div>
            <Link to="/transformations" className="inline-flex items-center gap-2 text-sm font-medium text-black underline underline-offset-4">
              Browse stories
              <Sparkles size={15} />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {storyHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[1.5rem] border border-black/10 bg-[linear-gradient(180deg,#fff_0%,#fbf4ef_100%)] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-black/5">
                    <Icon size={18} className="text-black/70" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-black/65">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
