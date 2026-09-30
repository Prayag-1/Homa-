import { Mail, Plus, RefreshCw, Save, Send, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import {
  useAdminEmailSettings,
  useCreateEmailSetting,
  useSendTestEmail,
  useUpdateEmailSetting,
} from '../../hooks/useEmailSettings';

const emptyForm = {
  label: '',
  host: '',
  port: 587,
  encryption: 'tls',
  username: '',
  password: '',
  fromEmail: '',
  fromName: '',
  isActive: true,
};

const normalizeForm = (item) => ({
  ...emptyForm,
  ...item,
  port: Number(item?.port || 587),
  password: '',
});

const fieldLabel = 'mb-2 block text-xs font-bold uppercase tracking-[0.08em]';

function Field({ label, children, helper }) {
  return (
    <label className="block">
      <span className={fieldLabel}>{label}</span>
      {children}
      {helper ? <span className="mt-2 block text-xs" style={{ color: 'var(--admin-muted)' }}>{helper}</span> : null}
    </label>
  );
}

export default function AdminEmailSettings() {
  const { user } = useAuth();
  const { data, isLoading } = useAdminEmailSettings();
  const createSetting = useCreateEmailSetting();
  const updateSetting = useUpdateEmailSetting();
  const testEmail = useSendTestEmail();

  const items = data?.items || [];
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [testRecipientEmail, setTestRecipientEmail] = useState('');

  useEffect(() => {
    if (user?.email && !testRecipientEmail) {
      setTestRecipientEmail(user.email);
    }
  }, [testRecipientEmail, user?.email]);

  useEffect(() => {
    if (!data) return;

    if (!selectedId) {
      const initial = items.find((item) => item.id === data.activeId) || items[0];
      if (initial) {
        setSelectedId(initial.id);
        setForm(normalizeForm(initial));
      } else {
        setSelectedId('new');
        setForm(emptyForm);
      }
      return;
    }

    if (selectedId === 'new') {
      setForm(emptyForm);
      return;
    }

    const next = items.find((item) => item.id === selectedId) || items.find((item) => item.id === data.activeId) || items[0];
    if (!next) {
      setSelectedId('new');
      setForm(emptyForm);
      return;
    }

    if (next.id !== selectedId) {
      setSelectedId(next.id);
    }
    setForm(normalizeForm(next));
  }, [data, items, selectedId]);

  const selectedSetting = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId],
  );

  const isEditing = Boolean(selectedSetting) && selectedId !== 'new';
  const activeId = data?.activeId || null;

  const handleSelect = (item) => {
    setSelectedId(item.id);
    setForm(normalizeForm(item));
  };

  const handleNew = () => {
    setSelectedId('new');
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      port: Number(form.port || 587),
      username: String(form.username || '').trim(),
      password: String(form.password || ''),
      fromEmail: String(form.fromEmail || '').trim(),
      fromName: String(form.fromName || '').trim(),
      label: String(form.label || '').trim(),
      host: String(form.host || '').trim(),
    };

    if (selectedId === 'new' || !selectedSetting) {
      const result = await createSetting.mutateAsync(payload);
      if (result?.data?.id) {
        setSelectedId(result.data.id);
      }
      setForm((current) => ({ ...current, password: '' }));
      return;
    }

    await updateSetting.mutateAsync({ id: selectedId, payload });
    setForm((current) => ({ ...current, password: '' }));
  };

  const handleTest = async () => {
    await testEmail.mutateAsync({ recipientEmail: testRecipientEmail.trim() || undefined });
  };

  return (
    <AdminLayout title="Email Settings" breadcrumb="Email Settings">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Email Settings</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
            Manage SMTP profiles, activate one at a time, and send a live test email.
          </p>
        </div>
        <button className="admin-button admin-button-primary" type="button" onClick={handleNew}>
          <Plus size={16} />
          New Profile
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.2fr]">
        <section className="admin-card overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--admin-border)' }}>
            <h3 className="font-bold">Saved SMTP Profiles</h3>
            <span className="admin-badge" style={{ background: '#24283A', borderColor: 'var(--admin-border)', color: 'var(--admin-muted)' }}>
              {items.length} total
            </span>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner color="var(--admin-text)" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-5 text-sm" style={{ color: 'var(--admin-muted)' }}>
              No SMTP profiles yet. Create one to start sending email from the admin panel.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--admin-border)' }}>
              {items.map((item) => {
                const isSelected = item.id === selectedId;
                const isActive = item.id === activeId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full px-4 py-4 text-left transition-colors ${isSelected ? 'bg-[rgba(209,0,0,0.08)]' : 'hover:bg-[rgba(255,255,255,0.03)]'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold">{item.label}</span>
                          {isActive ? (
                            <span className="admin-badge admin-badge-success">
                              <ShieldCheck size={12} />
                              Active
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 truncate text-sm" style={{ color: 'var(--admin-muted)' }}>
                          {item.fromEmail} · {item.host}:{item.port}
                        </div>
                      </div>
                      <Mail size={16} style={{ color: 'var(--admin-muted)' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="admin-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">
                {isEditing ? 'Edit SMTP Profile' : 'Create SMTP Profile'}
              </h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
                Password is write-only. Leave it blank when editing to keep the current value.
              </p>
            </div>
            {form.isActive ? (
              <span className="admin-badge admin-badge-success">
                <ShieldCheck size={12} />
                Active on save
              </span>
            ) : (
              <span className="admin-badge">Inactive</span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Label">
              <input className="admin-input" value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} placeholder="Primary SMTP" />
            </Field>
            <Field label="Host">
              <input className="admin-input" value={form.host} onChange={(event) => setForm((current) => ({ ...current, host: event.target.value }))} placeholder="smtp.example.com" />
            </Field>
            <Field label="Port">
              <input className="admin-input" type="number" min="1" max="65535" value={form.port} onChange={(event) => setForm((current) => ({ ...current, port: event.target.value }))} />
            </Field>
            <Field label="Encryption">
              <select className="admin-select" value={form.encryption} onChange={(event) => setForm((current) => ({ ...current, encryption: event.target.value }))}>
                <option value="none">None</option>
                <option value="ssl">SSL</option>
                <option value="tls">TLS</option>
              </select>
            </Field>
            <Field label="Username">
              <input className="admin-input" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} placeholder="smtp-user" />
            </Field>
            <Field label="Password" helper="This value is encrypted at rest and never shown again after saving.">
              <input className="admin-input" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter SMTP password'} />
            </Field>
            <Field label="From Email">
              <input className="admin-input" type="email" value={form.fromEmail} onChange={(event) => setForm((current) => ({ ...current, fromEmail: event.target.value }))} placeholder="noreply@example.com" />
            </Field>
            <Field label="From Name">
              <input className="admin-input" value={form.fromName} onChange={(event) => setForm((current) => ({ ...current, fromName: event.target.value }))} placeholder="HOMA Beauty" />
            </Field>
          </div>

          <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--admin-border)' }}>
            <div>
              <div className="text-sm font-semibold">Set as active SMTP profile</div>
              <div className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                Only one saved profile is active at a time.
              </div>
            </div>
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="admin-button admin-button-primary"
              type="button"
              onClick={handleSave}
              disabled={createSetting.isPending || updateSetting.isPending}
            >
              {createSetting.isPending || updateSetting.isPending ? <Spinner size="sm" color="currentColor" /> : <Save size={16} />}
              Save SMTP Profile
            </button>
            <button className="admin-button" type="button" onClick={handleNew}>
              <RefreshCw size={16} />
              Clear Form
            </button>
          </div>

          <div className="mt-6 border-t pt-5" style={{ borderColor: 'var(--admin-border)' }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold">Send Test Email</h4>
                <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
                  Sends using the active saved profile.
                </p>
              </div>
              <button
                className="admin-button admin-button-primary"
                type="button"
                onClick={handleTest}
                disabled={testEmail.isPending}
              >
                {testEmail.isPending ? <Spinner size="sm" color="currentColor" /> : <Send size={16} />}
                Send Test Email
              </button>
            </div>
            <Field label="Recipient Email">
              <input
                className="admin-input"
                type="email"
                value={testRecipientEmail}
                onChange={(event) => setTestRecipientEmail(event.target.value)}
                placeholder={user?.email || 'admin@example.com'}
              />
            </Field>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
