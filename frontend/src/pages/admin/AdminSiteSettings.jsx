import {
  Check,
  Facebook,
  Instagram,
  Link as LinkIcon,
  ImagePlus,
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
import { compressImageFile, MAX_IMAGE_SIZE_LABEL } from '../../utils/compressImage';
import {
  useAdminSettings,
  useUpdateAnnouncement,
  useUpdatePayment,
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

const emptyAnnouncement = {
  text: '',
  link: '',
  bgColor: '#D10000',
  textColor: '#FFFFFF',
  isActive: false,
  image: { url: '', publicId: '' },
};

const emptyPayment = {
  qrTitle: '',
  qrInstructions: '',
  beneficiaryName: '',
  supportNote: '',
  qrImage: { url: '', publicId: '' },
};

const normalizeFooter = (footer = {}) => ({
  ...emptyFooter,
  ...footer,
  shopLinks: footer.shopLinks || [],
  companyLinks: footer.companyLinks || [],
  contact: { ...emptyFooter.contact, ...(footer.contact || {}) },
  social: { ...emptyFooter.social, ...(footer.social || {}) },
});

const normalizePayment = (payment = {}) => ({
  ...emptyPayment,
  ...payment,
  qrImage: {
    ...emptyPayment.qrImage,
    ...(payment.qrImage || {}),
  },
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
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center border" style={{ borderColor: 'var(--admin-border)' }}>
        <Icon size={17} />
      </div>
      <input className="admin-input" value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={`https://${platform}.com/homa`} />
      {hasValue && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
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
  const updatePayment = useUpdatePayment();
  const updateFooter = useUpdateFooter();
  const [whatsapp, setWhatsapp] = useState({ phoneNumber: '', prefilledMessage: '', isEnabled: false });
  const [announcement, setAnnouncement] = useState(emptyAnnouncement);
  const [announcementImageFile, setAnnouncementImageFile] = useState(null);
  const [announcementImagePreview, setAnnouncementImagePreview] = useState('');
  const [announcementImageRemoved, setAnnouncementImageRemoved] = useState(false);
  const [payment, setPayment] = useState(emptyPayment);
  const [paymentQrFile, setPaymentQrFile] = useState(null);
  const [paymentQrPreview, setPaymentQrPreview] = useState('');
  const [paymentQrRemoved, setPaymentQrRemoved] = useState(false);
  const [footer, setFooter] = useState(emptyFooter);
  const [initialSnapshot, setInitialSnapshot] = useState('');

  useEffect(() => {
    if (!settings) return;
    const nextWhatsApp = settings.whatsapp || { phoneNumber: '', prefilledMessage: '', isEnabled: false };
    const nextAnnouncement = {
      ...emptyAnnouncement,
      ...(settings.announcementBar || {}),
      image: {
        ...emptyAnnouncement.image,
        ...(settings.announcementBar?.image || {}),
      },
    };
    const nextPayment = normalizePayment(settings.payment);
    const nextFooter = normalizeFooter(settings.footer);
    setWhatsapp(nextWhatsApp);
    setAnnouncement(nextAnnouncement);
    setAnnouncementImageFile(null);
    setAnnouncementImagePreview('');
    setAnnouncementImageRemoved(false);
    setPayment(nextPayment);
    setPaymentQrFile(null);
    setPaymentQrPreview('');
    setPaymentQrRemoved(false);
    setFooter(nextFooter);
    setInitialSnapshot(JSON.stringify({ whatsapp: nextWhatsApp, announcement: nextAnnouncement, payment: nextPayment, footer: nextFooter }));
  }, [settings]);

  useEffect(
    () => () => {
      if (announcementImagePreview) {
        URL.revokeObjectURL(announcementImagePreview);
      }
      if (paymentQrPreview) {
        URL.revokeObjectURL(paymentQrPreview);
      }
    },
    [announcementImagePreview, paymentQrPreview],
  );

  const dirty = useMemo(
    () =>
      initialSnapshot !== JSON.stringify({ whatsapp, announcement, payment, footer }) ||
      Boolean(announcementImageFile) ||
      Boolean(paymentQrFile) ||
      announcementImageRemoved ||
      paymentQrRemoved,
    [announcement, announcementImageFile, announcementImageRemoved, footer, initialSnapshot, payment, paymentQrFile, paymentQrRemoved, whatsapp],
  );

  const waUrl = whatsapp.phoneNumber
    ? `https://wa.me/${whatsapp.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(whatsapp.prefilledMessage || '')}`
    : 'WhatsApp preview unavailable';

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

  const handleAnnouncementImageChange = async (file) => {
    if (!file) return;

    if (announcementImagePreview) {
      URL.revokeObjectURL(announcementImagePreview);
    }

    try {
      const compressed = await compressImageFile(file);
      setAnnouncementImageFile(compressed);
      setAnnouncementImagePreview(URL.createObjectURL(compressed));
      setAnnouncementImageRemoved(false);
    } catch (err) {
      window.alert(err.message);
    }
  };

  const removeAnnouncementImage = () => {
    if (announcementImagePreview) {
      URL.revokeObjectURL(announcementImagePreview);
    }
    setAnnouncementImageFile(null);
    setAnnouncementImagePreview('');
    setAnnouncementImageRemoved(true);
    setAnnouncement((current) => ({ ...current, image: { url: '', publicId: '' } }));
  };

  const saveAnnouncement = () => {
    updateAnnouncement.mutate({
      text: announcement.text,
      link: announcement.link,
      bgColor: announcement.bgColor,
      textColor: announcement.textColor,
      isActive: announcement.isActive,
      removeImage: announcementImageRemoved,
      imageFile: announcementImageFile,
    });
  };

  const handlePaymentQrChange = async (file) => {
    if (!file) return;

    if (paymentQrPreview) {
      URL.revokeObjectURL(paymentQrPreview);
    }

    try {
      const compressed = await compressImageFile(file);
      setPaymentQrFile(compressed);
      setPaymentQrPreview(URL.createObjectURL(compressed));
      setPaymentQrRemoved(false);
    } catch (err) {
      window.alert(err.message);
    }
  };

  const removePaymentQrImage = () => {
    if (paymentQrPreview) {
      URL.revokeObjectURL(paymentQrPreview);
    }
    setPaymentQrFile(null);
    setPaymentQrPreview('');
    setPaymentQrRemoved(true);
    setPayment((current) => ({ ...current, qrImage: { url: '', publicId: '' } }));
  };

  const savePayment = () => {
    updatePayment.mutate({
      qrTitle: payment.qrTitle,
      qrInstructions: payment.qrInstructions,
      beneficiaryName: payment.beneficiaryName,
      supportNote: payment.supportNote,
      removeQrImage: paymentQrRemoved,
      qrImageFile: paymentQrFile,
    });
  };

  const tabs = [
    ['whatsapp', 'WhatsApp'],
    ['announcement', 'Announcement Bar'],
    ['payment', 'Payments'],
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
                    placeholder="International phone number"
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
            <div className="max-w-6xl space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-5">
                  <Toggle checked={announcement.isActive} onChange={(value) => setAnnouncement((current) => ({ ...current, isActive: value }))} label="Enable popup announcement" />
                  <Field label="Popup Text">
                    <textarea
                      className="admin-textarea"
                      maxLength={160}
                      value={announcement.text || ''}
                      onChange={(event) => setAnnouncement((current) => ({ ...current, text: event.target.value }))}
                      placeholder="Short message shown beside the image"
                    />
                    <div className="admin-char-count">{(announcement.text || '').length}/160</div>
                  </Field>
                  <Field label="Link">
                    <input
                      className="admin-input"
                      value={announcement.link || ''}
                      onChange={(event) => setAnnouncement((current) => ({ ...current, link: event.target.value }))}
                      placeholder="https://example.com"
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Background Color">
                      <div className="flex min-w-0 gap-2">
                        <input className="h-11 w-14 shrink-0 border-0 bg-transparent p-0" type="color" value={announcement.bgColor} onChange={(event) => setAnnouncement((current) => ({ ...current, bgColor: event.target.value }))} />
                        <input className="admin-input" value={announcement.bgColor} onChange={(event) => setAnnouncement((current) => ({ ...current, bgColor: event.target.value }))} />
                      </div>
                    </Field>
                    <Field label="Text Color">
                      <div className="flex min-w-0 gap-2">
                        <input className="h-11 w-14 shrink-0 border-0 bg-transparent p-0" type="color" value={announcement.textColor} onChange={(event) => setAnnouncement((current) => ({ ...current, textColor: event.target.value }))} />
                        <input className="admin-input" value={announcement.textColor} onChange={(event) => setAnnouncement((current) => ({ ...current, textColor: event.target.value }))} />
                      </div>
                    </Field>
                  </div>
                  <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--admin-border)', background: '#171A25' }}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold">Popup Image</h4>
                        <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>Upload a large hero image for the popup banner.</p>
                      </div>
                      {(announcementImageFile || announcement.image?.url) && (
                        <button className="admin-button admin-button-danger" type="button" onClick={removeAnnouncementImage}>
                          <Trash2 size={15} />
                          Remove
                        </button>
                      )}
                    </div>
                    <button
                    type="button"
                    className="admin-upload-zone !min-h-[180px]"
                    onClick={() => document.getElementById('announcement-image-input')?.click()}
                  >
                      {announcementImagePreview || announcement.image?.url ? (
                        <div className="w-full space-y-3">
                          <img
                            src={announcementImagePreview || announcement.image.url}
                            alt="Announcement preview"
                            className="mx-auto h-48 w-full max-w-[520px] rounded-2xl object-cover"
                          />
                          <span className="font-semibold">Click to replace the image</span>
                        </div>
                      ) : (
                        <>
                          <ImagePlus size={28} />
                          <span className="font-semibold">Click to upload or drag and drop</span>
                          <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                            JPEG, PNG, WebP up to {MAX_IMAGE_SIZE_LABEL}
                          </span>
                        </>
                      )}
                    </button>
                    <input
                      id="announcement-image-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleAnnouncementImageChange(file);
                        event.target.value = '';
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border p-4" style={{ borderColor: 'var(--admin-border)', background: '#0E1017' }}>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-bold">Popup Preview</h4>
                      <span className="admin-badge admin-badge-warning">First open</span>
                    </div>
                    <div className="overflow-hidden rounded-3xl border" style={{ borderColor: announcement.bgColor, background: announcement.bgColor }}>
                      <div className="grid min-h-[420px] grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="min-h-[240px] bg-black/5">
                          {(announcementImagePreview || announcement.image?.url) ? (
                            <img
                              src={announcementImagePreview || announcement.image.url}
                              alt="Popup preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full min-h-[240px] items-center justify-center p-8 text-center" style={{ color: announcement.textColor }}>
                              <div>
                                <p className="text-lg font-bold">Image preview area</p>
                                <p className="mt-2 text-sm opacity-80">Add a large promotional image here.</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center gap-4 p-6 md:p-8" style={{ color: announcement.textColor }}>
                          <div className="inline-flex w-fit rounded-full border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
                            Special announcement
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold leading-tight">
                              {announcement.text || 'Announcement preview'}
                            </h3>
                            <p className="mt-3 text-sm leading-6 opacity-90">
                              This popup is shown once when the app opens, then stays dismissed on this device until the announcement changes.
                            </p>
                          </div>
                          {announcement.link && (
                            <a
                              href={announcement.link}
                              className="inline-flex w-fit items-center rounded-full bg-white px-4 py-2 text-sm font-bold"
                              style={{ color: announcement.bgColor }}
                            >
                              Open link
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="admin-button admin-button-primary" type="button" disabled={updateAnnouncement.isPending} onClick={saveAnnouncement}>
                    {updateAnnouncement.isPending ? <Spinner size="sm" color="currentColor" /> : <Save size={16} />}
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="max-w-6xl space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.95fr]">
                <div className="space-y-5">
                  <Field label="Payment QR Title">
                    <input
                      className="admin-input"
                      value={payment.qrTitle || ''}
                      onChange={(event) => setPayment((current) => ({ ...current, qrTitle: event.target.value }))}
                      placeholder="Scan the QR code and upload your proof"
                    />
                  </Field>
                  <Field label="Instructions">
                    <textarea
                      className="admin-textarea"
                      maxLength={300}
                      value={payment.qrInstructions || ''}
                      onChange={(event) => setPayment((current) => ({ ...current, qrInstructions: event.target.value }))}
                      placeholder="Tell customers what to do after scanning the QR code"
                    />
                  </Field>
                  <Field label="Beneficiary Name">
                    <input
                      className="admin-input"
                      value={payment.beneficiaryName || ''}
                      onChange={(event) => setPayment((current) => ({ ...current, beneficiaryName: event.target.value }))}
                      placeholder="Account holder or business name"
                    />
                  </Field>
                  <Field label="Support Note">
                    <textarea
                      className="admin-textarea"
                      maxLength={300}
                      value={payment.supportNote || ''}
                      onChange={(event) => setPayment((current) => ({ ...current, supportNote: event.target.value }))}
                      placeholder="Shown under the QR code"
                    />
                  </Field>
                  <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--admin-border)', background: '#171A25' }}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold">Payment QR Code</h4>
                        <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>Upload the QR image customers will scan at checkout.</p>
                      </div>
                      {(paymentQrFile || payment.qrImage?.url) && (
                        <button className="admin-button admin-button-danger" type="button" onClick={removePaymentQrImage}>
                          <Trash2 size={15} />
                          Remove
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="admin-upload-zone !min-h-[220px]"
                      onClick={() => document.getElementById('payment-qr-input')?.click()}
                    >
                      {(paymentQrPreview || payment.qrImage?.url) ? (
                        <div className="w-full space-y-3">
                          <img
                            src={paymentQrPreview || payment.qrImage.url}
                            alt="Payment QR preview"
                            className="mx-auto h-52 w-full max-w-[420px] rounded-2xl object-contain bg-white p-3"
                          />
                          <span className="font-semibold">Click to replace the QR code</span>
                        </div>
                      ) : (
                        <>
                          <ImagePlus size={28} />
                          <span className="font-semibold">Click to upload or drag and drop</span>
                          <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                            JPEG, PNG, WebP up to {MAX_IMAGE_SIZE_LABEL}
                          </span>
                        </>
                      )}
                    </button>
                    <input
                      id="payment-qr-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handlePaymentQrChange(file);
                        event.target.value = '';
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border p-4" style={{ borderColor: 'var(--admin-border)', background: '#0E1017' }}>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-bold">Checkout Preview</h4>
                      <span className="admin-badge admin-badge-warning">QR flow</span>
                    </div>
                    <div className="rounded-3xl border p-5" style={{ borderColor: 'var(--admin-border)', background: '#111522' }}>
                      <div className="mb-4 text-center">
                        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--admin-muted)' }}> {payment.qrTitle || 'Payment QR'} </p>
                        <h3 className="mt-2 text-xl font-bold">{payment.beneficiaryName || 'HOMA Beauty'}</h3>
                        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--admin-muted)' }}>
                          {payment.qrInstructions || 'Customers scan the QR, pay, and upload the receipt before order submission.'}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        {(paymentQrPreview || payment.qrImage?.url) ? (
                          <img
                            src={paymentQrPreview || payment.qrImage.url}
                            alt="Checkout payment QR"
                            className="mx-auto h-60 w-full max-w-[320px] object-contain"
                          />
                        ) : (
                          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed" style={{ borderColor: 'var(--admin-border)' }}>
                            <p className="text-sm text-gray-500">No QR image uploaded yet.</p>
                          </div>
                        )}
                      </div>
                      <p className="mt-4 text-sm" style={{ color: 'var(--admin-muted)' }}>
                        {payment.supportNote || 'Admin will manually verify submitted proof before confirming the order.'}
                      </p>
                    </div>
                  </div>

                  <button className="admin-button admin-button-primary" type="button" disabled={updatePayment.isPending} onClick={savePayment}>
                    {updatePayment.isPending ? <Spinner size="sm" color="currentColor" /> : <Save size={16} />}
                    Save
                  </button>
                </div>
              </div>
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
