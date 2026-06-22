import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, HelpCircle, Search, ShieldCheck, Sparkles, Truck } from 'lucide-react';

const faqSections = [
  {
    category: 'Skin Basics',
    icon: Sparkles,
    items: [
      {
        question: 'How do I know which skincare product is right for my skin type?',
        answer:
          'Start with your primary concern: dryness, oiliness, acne, or sensitivity. Build a simple routine with cleanser, moisturizer, and sunscreen first, then add one active product at a time so you can see what actually helps.',
      },
      {
        question: 'Can I use multiple active ingredients together?',
        answer:
          'Yes, but do it carefully. If you are new to actives like retinol, vitamin C, or exfoliating acids, introduce only one new product every 1 to 2 weeks. If irritation appears, reduce frequency and focus on barrier repair.',
      },
      {
        question: 'How long does it usually take to see results?',
        answer:
          'Mild texture or hydration changes may appear within 1 to 2 weeks. More visible improvements like acne control, pigmentation, or firmness usually take 6 to 12 weeks of consistent use.',
      },
      {
        question: 'Do I really need sunscreen every day?',
        answer:
          'Yes. Daily sunscreen helps protect against dark spots, early aging, and irritation from other products. Use it even on cloudy days and when you are mostly indoors near windows.',
      },
    ],
  },
  {
    category: 'Orders & Delivery',
    icon: Truck,
    items: [
      {
        question: 'How long does delivery take?',
        answer:
          'Delivery time depends on your location and the courier workload. In most cases, orders are processed quickly and delivered within a few business days. You can contact support if an order seems delayed.',
      },
      {
        question: 'Can I cancel or change an order?',
        answer:
          'If the order has not been packed or dispatched yet, changes may be possible. Reach out as soon as possible with your order details so the team can check the status.',
      },
      {
        question: 'What payment methods are supported?',
        answer:
          'The website is set up for common local payment flows and cash on delivery where available. The exact options may depend on the checkout settings for your region.',
      },
    ],
  },
  {
    category: 'Website Help',
    icon: ShieldCheck,
    items: [
      {
        question: 'How do I create an account?',
        answer:
          'Use the Register page and complete the required details. If verification is enabled, you will receive a confirmation step before the account is fully active.',
      },
      {
        question: 'How do I contact support?',
        answer:
          'Use the Contact page for general questions, product help, or order support. You can also use the WhatsApp button if it is enabled on the site.',
      },
      {
        question: 'How do I find authorized dealers?',
        answer:
          'Open the Distributors page to browse the dealer list. Select a dealer to view details, open the larger map view, or launch directions directly in your browser.',
      },
      {
        question: 'Why do some pages load data from the backend and others do not?',
        answer:
          'Product, blog, distributor, and account pages use the backend API. Some content, like the FAQ page, is currently static and can be expanded later if you want admin-managed FAQs.',
      },
    ],
  },
];

function FaqItem({ question, answer, defaultOpen = false }) {
  return (
    <details
      className="group rounded-[1.4rem] border border-black/10 bg-white/90 p-5 shadow-sm transition-shadow hover:shadow-md"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span className="text-left text-base font-semibold leading-6 text-black md:text-lg">{question}</span>
        <ChevronDown size={18} className="shrink-0 text-black/45 transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-black/70 md:text-base">{answer}</p>
    </details>
  );
}

function SectionHeader({ title, icon: Icon, count }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-black/5">
          <Icon size={18} className="text-black/70" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-black md:text-2xl">{title}</h2>
          <p className="text-sm text-black/55">{count} questions</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [query, setQuery] = useState('');

  const filteredSections = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return faqSections;

    return faqSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          `${item.question} ${item.answer} ${section.category}`.toLowerCase().includes(term),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [query]);

  const totalQuestions = filteredSections.reduce((count, section) => count + section.items.length, 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8f1_0%,#f7efe7_42%,#fffdf9_100%)]">
      <Helmet>
        <title>FAQ | Homa</title>
        <meta
          name="description"
          content="Frequently asked questions about skincare, orders, and using the Homa website."
        />
      </Helmet>

      <section className="border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.35em] text-black/45">Help Center</p>
          <h1 className="mt-4 max-w-3xl font-heading text-5xl leading-tight text-black md:text-7xl">
            Frequently asked questions.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-black/65 md:text-lg">
            Answers about skin routines, product use, orders, delivery, and how the Homa website works.
          </p>

          <div className="mt-8 max-w-2xl">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/35" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a question..."
                className="w-full rounded-full border border-black/10 bg-white px-12 py-4 text-sm outline-none transition focus:border-black/25"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-black/55">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2">
            <HelpCircle size={15} />
            {totalQuestions} results
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2">
            <Sparkles size={15} />
            Skincare and site support
          </div>
        </div>

        <div className="space-y-10">
          {filteredSections.map((section) => (
            <section key={section.category}>
              <SectionHeader title={section.category} icon={section.icon} count={section.items.length} />
              <div className="space-y-3">
                {section.items.map((item, index) => (
                  <FaqItem
                    key={item.question}
                    question={item.question}
                    answer={item.answer}
                    defaultOpen={index === 0}
                  />
                ))}
              </div>
            </section>
          ))}

          {filteredSections.length === 0 && (
            <div className="rounded-[2rem] border border-black/10 bg-white/80 px-6 py-16 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-black">No matching questions</h2>
              <p className="mt-3 text-sm leading-7 text-black/65">
                Try a different search term or clear the current query.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
