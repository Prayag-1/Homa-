import { Helmet } from 'react-helmet-async';
import {
  BadgeCheck,
  Barcode,
  Factory,
  FileCheck2,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TestTube2,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const authenticitySteps = [
  {
    title: 'Check the pack and seal',
    description: 'Look for intact seals, crisp printing, and matching batch or lot codes on the box and bottle.',
    icon: BadgeCheck,
  },
  {
    title: 'Verify the manufacturer name',
    description: 'Authentic Japanese products should clearly name the manufacturer, importer, or authorized distributor.',
    icon: Factory,
  },
  {
    title: 'Scan the barcode or QR code',
    description: 'Use the barcode, QR label, or official product page to confirm the product code and variant.',
    icon: Barcode,
  },
  {
    title: 'Compare ingredient and label details',
    description: 'Ingredients, directions, and warnings should be consistent across the box, bottle, and product listing.',
    icon: FileCheck2,
  },
  {
    title: 'Review the seller source',
    description: 'Buy from trusted dealers and check whether the seller can provide invoice, import details, or warranty information.',
    icon: ScanSearch,
  },
  {
    title: 'Look for traceable support',
    description: 'A genuine product should be supported by customer service, lot tracking, and clear return or authenticity policies.',
    icon: ShieldCheck,
  },
];

const qualityHighlights = [
  {
    title: 'Certifications',
    description: 'Look for recognized certifications, product compliance marks, and documented quality control labels.',
    icon: BadgeCheck,
  },
  {
    title: 'Dermatological testing',
    description: 'Products may be tested for skin compatibility and formulated to meet quality expectations for sensitive routines.',
    icon: TestTube2,
  },
  {
    title: 'Japanese manufacturing standards',
    description: 'Packaging, formulation, and batch control should follow the discipline expected from Japanese manufacturing systems.',
    icon: Factory,
  },
];

export default function ProductAuthenticityPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7f0_0%,#f7efe7_45%,#fffdfb_100%)]">
      <Helmet>
        <title>Product Authenticity | Homa</title>
        <meta
          name="description"
          content="Learn how to check if a product is authentic and review HOMA's Japanese quality standards, testing, and certification highlights."
        />
      </Helmet>

      <section className="border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.35em] text-black/45">Authenticity guide</p>
            <h1 className="mt-4 font-display text-5xl leading-tight text-black md:text-7xl">
              How to verify a product is authentic.
            </h1>
            <p className="mt-5 text-base leading-7 text-black/65 md:text-lg">
              Use these checks to confirm packaging, origin, label details, and support before you buy.
              We also highlight the quality signals we expect from Japanese skincare and beauty products.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {authenticitySteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className="rounded-[1.75rem] border border-black/10 bg-white/85 p-5 shadow-sm md:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-black/5">
                    <Icon size={18} className="text-black/70" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                      Step {index + 1}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-black">{step.title}</h2>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-black/60">{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:pb-20">
        <div className="rounded-[2rem] border border-black/10 bg-[#1A1410] p-6 text-white shadow-[0_24px_80px_rgba(26,20,16,0.12)] md:p-8">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.35em] text-white/45">Japanese quality standards</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">Quality signals we highlight</h2>
            <p className="mt-3 text-sm leading-6 text-white/70 md:text-base">
              These are the key proof points to look for when evaluating imported Japanese beauty products.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {qualityHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                    <Icon size={18} className="text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{item.description}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 md:flex md:items-center md:justify-between md:gap-4">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="mt-0.5 text-white/80" />
              <div>
                <p className="font-semibold text-white">Practical rule</p>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  If the packaging, batch code, and seller story do not line up, treat the product as unverified.
                </p>
              </div>
            </div>
            <Link
              to="/shop"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 md:mt-0"
            >
              Browse products
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:pb-20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-black/10 bg-white/85 p-6 shadow-sm md:p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-black/45">Red flags</p>
            <h2 className="mt-3 text-2xl font-semibold text-black">When to be careful</h2>
            <div className="mt-5 space-y-4">
              {[
                'Missing batch codes or expiry details.',
                'Poorly aligned labels, blurry printing, or misspellings.',
                'A seller cannot explain the product origin.',
                'No visible quality assurance or certification details.',
                'Unrealistically low pricing compared with the category.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-black/10 bg-black/5 p-4">
                  <AlertTriangle size={18} className="mt-0.5 text-[#C8432B]" />
                  <p className="text-sm leading-6 text-black/70">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-black/10 bg-white/85 p-6 shadow-sm md:p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-black/45">What we support</p>
            <h2 className="mt-3 text-2xl font-semibold text-black">Clear standards, clear sourcing</h2>
            <p className="mt-4 text-sm leading-6 text-black/60">
              HOMA’s authenticity approach is built around traceable sourcing, visible product detail,
              and quality signals that can be checked before purchase.
            </p>
            <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-black/5 p-5">
              <p className="text-sm font-semibold text-black">Included checks</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-black/65">
                <li>Certifications and product documentation</li>
                <li>Dermatological testing references where available</li>
                <li>Japanese manufacturing and packaging standards</li>
                <li>Seller and distributor traceability</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
