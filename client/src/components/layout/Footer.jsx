import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Youtube,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublicSettings } from '../../hooks/useSiteSettings';

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.6 2c.32 2.77 1.9 4.42 4.52 4.6v3.1a7.7 7.7 0 0 1-4.44-1.4v6.68c0 3.38-2.05 6.02-5.5 6.02-3.1 0-5.3-2.08-5.3-5.07 0-3.46 2.95-5.46 6.18-5.05v3.24c-1.24-.2-2.86.35-2.86 1.72 0 1.02.84 1.66 1.91 1.66 1.25 0 2.08-.78 2.08-2.55V2h3.41Z" />
    </svg>
  );
}

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: TikTokIcon,
  youtube: Youtube,
};

const sortLinks = (links = []) =>
  links
    .filter((link) => link.isActive !== false && link.label && link.url)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

function FooterLink({ link }) {
  const className = "inline-block text-white/70 transition duration-200 hover:translate-x-1 hover:text-white";

  if (link.url.startsWith('/')) {
    return <Link to={link.url} className={className}>{link.label}</Link>;
  }

  return (
    <a href={link.url} className={className} target="_blank" rel="noopener noreferrer">
      {link.label}
    </a>
  );
}

function LinkColumn({ title, links }) {
  return (
    <div>
      <h4 className="mb-5 font-body text-xs font-bold uppercase tracking-[0.22em] text-brand-red">{title}</h4>
      <ul className="space-y-3 font-body text-sm">
        {links.length > 0 ? links.map((link) => (
          <li key={`${link.label}-${link.url}`}>
            <FooterLink link={link} />
          </li>
        )) : (
          <li className="text-white/45">No links available</li>
        )}
      </ul>
    </div>
  );
}

function FooterSkeleton() {
  return (
    <footer className="bg-[#1A1410] px-4 py-16 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <div className="h-5 w-28 animate-pulse bg-white/10" />
            <div className="h-4 w-full animate-pulse bg-white/10" />
            <div className="h-4 w-3/4 animate-pulse bg-white/10" />
            <div className="h-4 w-1/2 animate-pulse bg-white/10" />
          </div>
        ))}
      </div>
    </footer>
  );
}

export default function Footer() {
  const { data: settings, isLoading } = usePublicSettings();

  if (isLoading) return <FooterSkeleton />;

  const footer = settings?.footer || {};
  const whatsapp = settings?.whatsapp;
  const shopLinks = sortLinks(footer.shopLinks);
  const companyLinks = sortLinks(footer.companyLinks);
  const socialEntries = Object.entries(footer.social || {}).filter(([, url]) => Boolean(url));

  return (
    <footer className="bg-[#1A1410] text-white">
      <div className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="font-display text-5xl font-semibold text-brand-red">HOMA</Link>
            {footer.tagline && (
              <p className="mt-5 max-w-xs font-body text-sm leading-6 text-white/70">{footer.tagline}</p>
            )}
            {socialEntries.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {socialEntries.map(([platform, url]) => {
                  const Icon = socialIcons[platform];
                  if (!Icon) return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center border border-white/10 text-white/70 transition duration-200 hover:border-brand-red hover:text-brand-red"
                      aria-label={platform}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <LinkColumn title="Shop" links={shopLinks} />
          <LinkColumn title="Company" links={companyLinks} />

          <div>
            <h4 className="mb-5 font-body text-xs font-bold uppercase tracking-[0.22em] text-brand-red">Get In Touch</h4>
            <div className="space-y-4 font-body text-sm text-white/70">
              {footer.contact?.address && (
                <div className="flex gap-3">
                  <MapPin size={17} className="mt-0.5 flex-shrink-0 text-brand-red" />
                  <span>{footer.contact.address}</span>
                </div>
              )}
              {footer.contact?.phone && (
                <a href={`tel:${footer.contact.phone}`} className="flex gap-3 transition hover:text-white">
                  <Phone size={17} className="mt-0.5 flex-shrink-0 text-brand-red" />
                  <span>{footer.contact.phone}</span>
                </a>
              )}
              {footer.contact?.email && (
                <a href={`mailto:${footer.contact.email}`} className="flex gap-3 transition hover:text-white">
                  <Mail size={17} className="mt-0.5 flex-shrink-0 text-brand-red" />
                  <span>{footer.contact.email}</span>
                </a>
              )}
              {whatsapp?.isEnabled && whatsapp?.waUrl && (
                <a
                  href={whatsapp.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 font-body text-sm font-bold text-white transition hover:brightness-110"
                >
                  <MessageCircle size={17} />
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 text-center font-body text-xs text-white/55 md:grid-cols-3">
          <div className="md:text-left">{footer.copyright}</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {footer.showPaymentIcons && (
              <>
                <span className="rounded-full bg-[#6EC207]/15 px-3 py-1 font-bold text-[#8CEB27]">eSewa</span>
                <span className="rounded-full bg-[#2563EB]/15 px-3 py-1 font-bold text-[#93C5FD]">Fonepay</span>
                <span className="rounded-full bg-[#F59E0B]/15 px-3 py-1 font-bold text-[#FCD34D]">COD</span>
              </>
            )}
          </div>
         
        </div>
      </div>
    </footer>
  );
}
