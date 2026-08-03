import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock3,
  Instagram,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Send,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AddressMapPicker } from '../components/shared';
import api from '../services/api';
import { usePublicSettings } from '../hooks/useSiteSettings';

const contactWhatsAppHandle = import.meta.env.VITE_WHATSAPP_HANDLE || 'WhatsApp';
const contactWhatsAppUrl = import.meta.env.VITE_WHATSAPP_URL || '#';
const contactEmail = 'info.homanepal@gmail.com';

const socialLinks = [
  {
    name: 'Instagram',
    handle: '@homa_nepal',
    href: 'https://www.instagram.com/homa_nepal/',
    color: '#E1306C',
    icon: Instagram,
  },
  {
    name: 'WhatsApp',
    handle: contactWhatsAppHandle,
    href: contactWhatsAppUrl,
    color: '#25D366',
    icon: MessageCircle,
  },
  {
    name: 'TikTok',
    handle: '@homanepal',
    href: 'https://www.tiktok.com/@homanepal',
    color: '#EE1D52',
    icon: Music2,
  },
];

const initialForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

const bannerBase = 'mb-5 flex items-start gap-3 border px-4 py-3';

export default function ContactUsPage() {
  const { data: settings } = usePublicSettings();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');
  const [hoveredLink, setHoveredLink] = useState(null);
  const contact = settings?.footer?.contact || {};
  const infoRows = [
    {
      label: 'Email',
      value: contactEmail,
      icon: Mail,
    },
    {
      label: 'Location',
      value: contact.address || 'Kathmandu, Nepal',
      icon: MapPin,
    },
    {
      label: 'Response time',
      value: 'Within 24 hours',
      icon: Clock3,
    },
  ];

  const isLoading = status === 'loading';
  const isFormValid = [form.name, form.email, form.subject, form.message].every((value) =>
    value.trim().length > 0,
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (status !== 'loading') {
      setStatus('idle');
      setFeedback('');
    }
  };

  const handleSubmit = async () => {
    const missing = [
      !form.name.trim() && 'name',
      !form.email.trim() && 'email',
      !form.subject.trim() && 'subject',
      !form.message.trim() && 'message',
    ].filter(Boolean);

    if (missing.length > 0) {
      setStatus('error');
      setFeedback(`Missing required fields: ${missing.join(', ')}`);
      return;
    }

    setStatus('loading');
    setFeedback('');

    try {
      const { data } = await api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setStatus('success');
      setFeedback(data.message || 'Message sent successfully.');
      setForm(initialForm);
    } catch (error) {
      setStatus('error');
      setFeedback(error?.message || 'Failed to send message. Please try again later.');
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7f2_0%,#f7efe7_42%,#fffdf9_100%)]">
      <Helmet>
        <title>Contact Us | Homa</title>
        <meta
          name="description"
          content="Contact Homa for product questions, orders, support, and general inquiries."
        />
      </Helmet>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/10 bg-white/85 p-8 shadow-[0_24px_80px_rgba(26,20,16,0.10)] backdrop-blur md:p-10">
              <p className="text-sm uppercase tracking-[0.35em] text-black/45">Get in touch</p>
              <h1 className="mt-4 max-w-xl font-heading text-5xl leading-tight md:text-7xl">
                Contact the Homa team.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-black/70 md:text-lg">
                Send us a message about products, orders, partnerships, or anything else you want help
                with. We usually reply within one business day.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {infoRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="min-w-0 rounded-2xl border border-black/10 bg-black/5 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-black/10">
                        <Icon size={18} className="text-black/75" />
                      </div>
                      <p className="mt-4 text-xs uppercase tracking-[0.25em] text-black/45">{row.label}</p>
                      <p className="mt-2 break-words text-sm font-medium leading-6 text-black/80">{row.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,#18120f_0%,#2b201b_100%)] p-7 text-white shadow-[0_20px_60px_rgba(26,20,16,0.18)]">
              <p className="text-xs uppercase tracking-[0.35em] text-white/55">Follow us</p>
              <div className="mt-5 space-y-3">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  const isHovered = hoveredLink === link.name;
                  const backgroundColor = isHovered ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)';
                  const borderColor = isHovered ? `${link.color}88` : 'rgba(255,255,255,0.12)';
                  const iconBackground = `${link.color}20`;
                  const iconBorder = `${link.color}44`;

                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={() => setHoveredLink(link.name)}
                      onMouseLeave={() => setHoveredLink(null)}
                      className="flex items-center gap-4 border p-4 transition-colors"
                      style={{ backgroundColor, borderColor }}
                    >
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center border"
                        style={{ backgroundColor: iconBackground, borderColor: iconBorder }}
                      >
                        <Icon size={18} color={link.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white">{link.name}</div>
                        <div className="mt-1 text-sm text-white/65">{link.handle}</div>
                      </div>
                      <ArrowRight size={18} className="text-white/60" />
                    </a>
                  );
                })}
              </div>
            </div>

            <AddressMapPicker
              address="Kathmandu, Nepal"
              title="Visit our Kathmandu base"
              description="Find our main location and get a visual sense of the area we serve from."
              variant="light"
              className="shadow-[0_20px_60px_rgba(26,20,16,0.10)]"
            />
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white/85 p-8 shadow-[0_24px_80px_rgba(26,20,16,0.10)] backdrop-blur md:p-10">
            <p className="text-sm uppercase tracking-[0.35em] text-black/45">Send a message</p>
            <h2 className="mt-4 text-3xl font-semibold text-black">Tell us what you need.</h2>

            {status === 'success' && feedback && (
              <div className={bannerBase} style={{ background: '#16A34A10', borderColor: '#16A34A30' }}>
                <CheckCircle className="mt-0.5 shrink-0 text-[#16A34A]" size={18} />
                <div className="text-sm text-[#166534]">{feedback}</div>
              </div>
            )}

            {status === 'error' && feedback && (
              <div className={bannerBase} style={{ background: '#DC262610', borderColor: '#DC262630' }}>
                <AlertCircle className="mt-0.5 shrink-0 text-[#DC2626]" size={18} />
                <div className="text-sm text-[#991B1B]">{feedback}</div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-black/45">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-black/45">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-black/45">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400"
                value={form.subject}
                onChange={(event) => updateField('subject', event.target.value)}
                placeholder="How can we help?"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-black/45">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full resize-none border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400"
                rows={6}
                value={form.message}
                onChange={(event) => updateField('message', event.target.value)}
                placeholder="Write your message..."
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <Link to="/about" className="text-sm font-medium text-black underline underline-offset-4 transition hover:text-red-600">
                Learn more about Homa
              </Link>

              <button
                className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {isLoading ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
