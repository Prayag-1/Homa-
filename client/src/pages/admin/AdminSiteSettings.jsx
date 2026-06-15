import {
  Check,
  Facebook,
  Instagram,
  Link as LinkIcon,
  MessageCircle,
  Music2,
  Plus,
  Save,
  Trash2,
  X,
  Youtube,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Spinner from '../../components/ui/Spinner';
import {
  useAdminSettings,
  useUpdateAnnouncement,
  useUpdateFooter,
  useUpdateWhatsApp,
} from '../../hooks/useSiteSettings';

const emptyFooter = {
  tagline: '',
  copyright: '',
  showPaymentIcons: true,
  shopLinks: [],
  companyLinks: [],
  contact: { address: '', phone: '', email: '', mapUrl: '' },
  social: { facebook: '', instagram: '', tiktok: '', youtube: '' },
};

const normalizeFooter = (footer = {}) => ({
  ...emptyFooter,
  ...footer,
  shopLinks: footer.shopLinks || [],
  companyLinks: footer.companyLinks || [],
  contact: { ...emptyFooter.contact, ...(footer.contact || {}) },
  social: { ...emptyFooter.social, ...(footer.social || {}) },
});

function Toggle({ checked, onChange, label }) {
  return (
    <div className="admin-toggle-row">
      <span className="text-sm font-semibold">{label}</span>
      <button
        className={`admin-toggle ${checked ? 'admin-toggle-on' : ''}`}
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span />
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="admin-field-label">{label}</label>
      {children}
    </div>
  );
}

function LinkRows({ title, links, onChange }) {
  const update = (index, key, value) => {
    onChange(links.map((link, itemIndex) => (itemIndex === index ? { ...link, [key]: value } : link)));
  };

  const remove = (index) => {
    onChange(links.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-bold">{title}</h4>
        <button
          className="admin-button"
          type="button"
          disabled={links.length >= 10}
          onClick={() => onChange([...links, { label: '', url: '', sortOrder: links.length, isActive: true }])}
        >
          <Plus size={15} />
          Add Link
        </button>
      </div>
      <div className="space-y-2">
        {links.map((link, index) => (
          <div key={index} className="grid grid-cols-1 gap-2 border p-3 lg:grid-cols-[1fr_1.6fr_90px_90px_36px]" style={{ borderColor: 'var(--admin-border)' }}>
            <input className="admin-input" value={link.label || ''} onChange={(event) => update(index, 'label', event.target.value)} placeholder="Label" />
            <input className="admin-input" value={link.url || ''} onChange={(event) => update(index, 'url', event.target.value)} placeholder="https://example.com" />
            <input className="admin-input" type="number" value={link.sortOrder ?? 0} onChange={(event) => update(index, 'sortOrder', Number(event.target.value))} />
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--admin-muted)' }}>
              <input type="checkbox" checked={link.isActive !== false} onChange={(event) => update(index, 'isActive', event.target.checked)} />
              Active
            </label>
            <button className="admin-button admin-icon-button" type="button" onClick={() => remove(index)} aria-label={`Delete ${title} link`}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {links.length === 0 && <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>No links yet.</p>}
      </div>
    </section>
  );
}

const socialConfig = {
  facebook: { icon: Facebook, pattern: /facebook\.com/i },
  instagram: { icon: Instagram, pattern: /instagram\.com/i },
  tiktok: { icon: Music2, pattern: /tiktok\.com/i },
  youtube: { icon: Youtube, pattern: /(youtube\.com|youtu\.be)/i },
};

function SocialField({ platform, value, onChange }) {
  const config = socialConfig[platform];
  const Icon = config.icon;
  const hasValue = Boolean(value);
  const isUrl = /^https?:\/\//i.test(value);
  const valid = !hasValue || (isUrl && config.pattern.test(value));
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-[38px] w-[38px] items-center justify-center border" style={{ borderColor: 'var(--admin-border)' }}>
        <Icon size={17} />
      </div>
      <input className="admin-input" value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={`https://${platform}.com/homa`} />
      {hasValue && (
        <div className="flex h-[38px] w-[38px] items-center justify-center">
          {valid ? <Check size={18} className="text-emerald-300" /> : <X size={18} className="text-red-300" />}
        </div>
      )}
    </div>
  );
}

const cleanLinks = (links) =>
  links
    .filter((link) => link.label?.trim() && link.url?.trim())
    .slice(0, 10)
    .map((link) => ({
      label: link.label.trim(),
      url: link.url.trim(),
      sortOrder: Number(link.sortOrder || 0),
      isActive: link.isActive !== false,
    }));

export default function AdminSiteSettings() {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const { data: settings, isLoading } = useAdminSettings();
  const updateWhatsApp = useUpdateWhatsApp();
  const updateAnnouncement = useUpdateAnnouncement();
  const updateFooter = useUpdateFooter();
  const [whatsapp, setWhatsapp] = useState({ phoneNumber: '', prefilledMessage: '', isEnabled: false });
  const [announcement, setAnnouncement] = useState({ text: '', link: '', bgColor: '#D10000', textColor: '#FFFFFF', isActive: false });
  const [footer, setFooter] = useState(emptyFooter);
  const [initialSnapshot, setInitialSnapshot] = useState('');

  useEffect(() => {
    if (!settings) return;
    const nextWhatsApp = settings.whatsapp || { phoneNumber: '', prefilledMessage: '', isEnabled: false };
    const nextAnnouncement = settings.announcementBar || { text: '', link: '', bgColor: '#D10000', textColor: '#FFFFFF', isActive: false };
    const nextFooter = normalizeFooter(settings.footer);
    setWhatsapp(nextWhatsApp);
    setAnnouncement(nextAnnouncement);
    setFooter(nextFooter);
    setInitialSnapshot(JSON.stringify({ whatsapp: nextWhatsApp, announcement: nextAnnouncement, footer: nextFooter }));
  }, [settings]);

  const dirty = useMemo(
    () => initialSnapshot !== JSON.stringify({ whatsapp, announcement, footer }),
    [announcement, footer, initialSnapshot, whatsapp],
  );

  const waUrl = whatsapp.phoneNumber
    ? `https://wa.me/${whatsapp.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(whatsapp.prefilledMessage || '')}`
    : 'https://wa.me/977XXXXXXXXXX?text=...';

  const saveFooter = () => {
    const contact = {
      address: footer.contact.address,
      phone: footer.contact.phone,
    };
    if (footer.contact.email) contact.email = footer.contact.email;
    if (footer.contact.mapUrl) contact.mapUrl = footer.contact.mapUrl;

    updateFooter.mutate({
      tagline: footer.tagline,
      copyright: footer.copyright,
      showPaymentIcons: footer.showPaymentIcons,
      shopLinks: cleanLinks(footer.shopLinks),
      companyLinks: cleanLinks(footer.companyLinks),
      contact,
      social: footer.social,
    });
  };

  const tabs = [
    ['whatsapp', 'WhatsApp'],
    ['announcement', 'Announcement Bar'],
    ['footer', 'Footer'],
  ];

  return (
    <AdminLayout title="Settings" breadcrumb="Settings">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Site Settings</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>Manage public site content and contact surfaces.</p>
        </div>
        {dirty && <span className="admin-badge admin-badge-warning">Unsaved changes</span>}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            className={`admin-pill ${activeTab === key ? 'admin-pill-selected' : ''}`}
            type="button"
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="admin-card flex h-64 items-center justify-center">
          <Spinner color="var(--admin-text)" />
        </div>
      ) : (
        <div className="admin-card p-5">
          {activeTab === 'whatsapp' && (
            <div className="max-w-2xl space-y-5">
              <Toggle checked={whatsapp.isEnabled} onChange={(value) => setWhatsapp((current) => ({ ...current, isEnabled: value }))} label="Enable WhatsApp Chat" />
              {whatsapp.isEnabled && (
                <Field label="Phone Number">
                  <input
                    className="admin-input"
                    value={whatsapp.phoneNumber || ''}
                    onChange={(event) => setWhatsapp((current) => ({ ...current, phoneNumber: event.target.value }))}
                    placeholder="+977XXXXXXXXXX"
                  />
                  <p className="mt-2 text-xs" style={{ color: 'var(--admin-muted)' }}>International format with country code. Nepal: +977</p>
                </Field>
              )}
              <Field label="Pre-filled Message">
                <textarea
                  className="admin-textarea"
                  maxLength={200}
                  value={whatsapp.prefilledMessage || ''}
                  onChange={(event) => setWhatsapp((current) => ({ ...current, prefilledMessage: event.target.value }))}
                />
                <div className="admin-char-count">{(whatsapp.prefilledMessage || '').length}/200</div>
              </Field>
              <div className="border p-3 text-sm" style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-muted)' }}>
                Preview: {waUrl}
              </div>
              <button
                className="admin-button admin-button-primary"
                type="button"
                disabled={updateWhatsApp.isPending || (whatsapp.isEnabled && !whatsapp.phoneNumber)}
                onClick={() => updateWhatsApp.mutate({ ...whatsapp, phoneNumber: whatsapp.phoneNumber })}
              >
                {updateWhatsApp.isPending ? <Spinner size="sm" color="currentColor" /> : <Save size={16} />}
                Save
              </button>
            </div>
          )}

          {activeTab === 'announcement' && (
            <div className="max-w-3xl space-y-5">
              <Toggle checked={announcement.isActive} onChange={(value) => setAnnouncement((current) => ({ ...current, isActive: value }))} label="Show announcement bar" />
              {announcement.isActive && (
                <>
                  <Field label="Text">
                    <input
                      className="admin-input"
                      maxLength={200}
                      value={announcement.text || ''}
                      onChange={(event) => setAnnouncement((current) => ({ ...current, text: event.target.value }))}
                    />
                    <div className="admin-char-count">{(announcement.text || '').length}/200</div>
                  </Field>
                  <Field label="Link">
                    <input className="admin-input" value={announcement.link || ''} onChange={(event) => setAnnouncement((current) => ({ ...current, link: event.target.value }))} placeholder="https://example.com" />
                  </Field>
                </>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Background Color">
                  <div className="flex gap-2">
                    <input className="h-[38px] w-[54px] border-0 bg-transparent p-0" type="color" value={announcement.bgColor} onChange={(event) => setAnnouncement((current) => ({ ...current, bgColor: event.target.value }))} />
                    <input className="admin-input" value={announcement.bgColor} onChange={(event) => setAnnouncement((current) => ({ ...current, bgColor: event.target.value }))} />
                  </div>
                </Field>
                <Field label="Text Color">
                  <div className="flex gap-2">
                    <input className="h-[38px] w-[54px] border-0 bg-transparent p-0" type="color" value={announcement.textColor} onChange={(event) => setAnnouncement((current) => ({ ...current, textColor: event.target.value }))} />
                    <input className="admin-input" value={announcement.textColor} onChange={(event) => setAnnouncement((current) => ({ ...current, textColor: event.target.value }))} />
                  </div>
                </Field>
              </div>
              <div className="px-4 py-3 text-center text-sm font-bold" style={{ background: announcement.bgColor, color: announcement.textColor }}>
                {announcement.text || 'Announcement preview'}
              </div>
              <button className="admin-button admin-button-primary" type="button" disabled={updateAnnouncement.isPending} onClick={() => updateAnnouncement.mutate(announcement)}>
                {updateAnnouncement.isPending ? <Spinner size="sm" color="currentColor" /> : <Save size={16} />}
                Save
              </button>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Tagline">
                  <input className="admin-input" value={footer.tagline || ''} onChange={(event) => setFooter((current) => ({ ...current, tagline: event.target.value }))} />
                </Field>
                <Field label="Copyright Text">
                  <input className="admin-input" value={footer.copyright || ''} onChange={(event) => setFooter((current) => ({ ...current, copyright: event.target.value }))} />
                </Field>
              </div>
              <Toggle checked={footer.showPaymentIcons} onChange={(value) => setFooter((current) => ({ ...current, showPaymentIcons: value }))} label="Show Payment Icons" />
              <LinkRows title="Shop Links" links={footer.shopLinks} onChange={(links) => setFooter((current) => ({ ...current, shopLinks: links }))} />
              <LinkRows title="Company Links" links={footer.companyLinks} onChange={(links) => setFooter((current) => ({ ...current, companyLinks: links }))} />

              <section className="space-y-3">
                <h4 className="font-bold">Contact</h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {['address', 'phone', 'email', 'mapUrl'].map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <LinkIcon size={16} style={{ color: 'var(--admin-muted)' }} />
                      <input
                        className="admin-input"
                        value={footer.contact[key] || ''}
                        onChange={(event) => setFooter((current) => ({ ...current, contact: { ...current.contact, [key]: event.target.value } }))}
                        placeholder={key === 'mapUrl' ? 'Map URL' : key}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="font-bold">Social Media</h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {Object.keys(socialConfig).map((platform) => (
                    <SocialField
                      key={platform}
                      platform={platform}
                      value={footer.social[platform]}
                      onChange={(value) => setFooter((current) => ({ ...current, social: { ...current.social, [platform]: value } }))}
                    />
                  ))}
                </div>
              </section>

              <button className="admin-button admin-button-primary" type="button" disabled={updateFooter.isPending} onClick={saveFooter}>
                {updateFooter.isPending ? <Spinner size="sm" color="currentColor" /> : <Save size={16} />}
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
