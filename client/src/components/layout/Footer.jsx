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
import HomaLogo from '../common/HomaLogo';
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
  const className = 'inline-block font-body text-sm text-white transition duration-200 hover:translate-x-1 hover:underline';

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
      <h4 className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">{title}</h4>
      <ul className="space-y-3">
        {links.length > 0 ? links.map((link) => (
          <li key={`${link.label}-${link.url}`}>
            <FooterLink link={link} />
          </li>
        )) : (
          <li className="font-body text-sm text-white/55">No links available</li>
        )}
      </ul>
    </div>
  );
}

function FooterSkeleton() {
  return (
    <footer className="sakura-pattern bg-homa-red px-5 py-12 text-white md:px-12 md:py-16">
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
    <footer className="text-white">
      <div className="sakura-pattern bg-homa-red px-5 py-12 md:px-12 md:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" aria-label="HOMA home">
              <HomaLogo variant="white" size="md" />
            </Link>
            {footer.tagline && (
              <p className="mt-5 max-w-xs font-body text-sm leading-6 text-white/80">{footer.tagline}</p>
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition duration-200 hover:opacity-70"
                      aria-label={platform}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <LinkColumn title="Shop" links={shopLinks} />
          <LinkColumn title="Company" links={companyLinks} />

          <div>
            <h4 className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Find Us</h4>
            <div className="space-y-4 font-body text-sm text-white">
              {footer.contact?.address && (
                <div className="flex gap-3">
                  <MapPin size={17} className="mt-0.5 flex-shrink-0 text-white" />
                  <span>{footer.contact.address}</span>
                </div>
              )}
              {footer.contact?.phone && (
                <a href={`tel:${footer.contact.phone}`} className="flex gap-3 transition hover:underline">
                  <Phone size={17} className="mt-0.5 flex-shrink-0 text-white" />
                  <span>{footer.contact.phone}</span>
                </a>
              )}
              {footer.contact?.email && (
                <a href={`mailto:${footer.contact.email}`} className="flex gap-3 transition hover:underline">
                  <Mail size={17} className="mt-0.5 flex-shrink-0 text-white" />
                  <span>{footer.contact.email}</span>
                </a>
              )}
              {whatsapp?.isEnabled && whatsapp?.waUrl && (
                <a
                  href={whatsapp.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-pill bg-[#25D366] px-5 py-2.5 font-body text-sm font-bold text-white transition hover:brightness-110"
                >
                  <MessageCircle size={17} />
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15 bg-homa-red-dark px-5 py-4 md:px-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 text-center font-body text-xs text-white/80 md:grid-cols-3">
          <div className="md:text-left">{footer.copyright || 'Copyright HOMA. All rights reserved.'}</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {footer.showPaymentIcons && (
              <>
                <span className="rounded-pill bg-white px-3 py-1 font-bold text-homa-red">eSewa</span>
                <span className="rounded-pill bg-white px-3 py-1 font-bold text-homa-red">Fonepay</span>
                <span className="rounded-pill bg-white px-3 py-1 font-bold text-homa-red">COD</span>
              </>
            )}
          </div>
          <div className="md:text-right">Made with {'\u2665'} in Nepal</div>
        </div>
      </div>
    </footer>
  );
}
