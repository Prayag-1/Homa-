import { ImagePlus, PencilLine, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Spinner from '../../components/ui/Spinner';
import { optimizeImage } from '../../utils/cloudinaryUrl';
import { compressImageFile, MAX_IMAGE_SIZE_LABEL } from '../../utils/compressImage';
import {
  useAdminBanners,
  useCreateBanner,
  useDeleteBanner,
  useUpdateBanner,
} from '../../hooks/useBanners';

const emptyForm = {
  title: '',
  link: '',
  sortOrder: 0,
  isActive: true,
};

export default function AdminBanners() {
  const { data: banners, isLoading } = useAdminBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const sortedBanners = useMemo(
    () => [...(Array.isArray(banners) ? banners : [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [banners],
  );

  useEffect(() => () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const resetForm = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setForm(emptyForm);
    setEditingId('');
    setImageFile(null);
    setImagePreview('');
  };

  const startEdit = (banner) => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setEditingId(banner.id);
    setForm({
      title: banner.title || '',
      link: banner.link || '',
      sortOrder: banner.sortOrder || 0,
      isActive: banner.isActive !== false,
    });
    setImageFile(null);
    setImagePreview(banner.imageUrl || '');
  };

  const handleImageChange = async (file) => {
    if (!file) return;
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    try {
      const compressed = await compressImageFile(file);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      imageFile,
    };

    if (editingId) {
      updateBanner.mutate(
        { id: editingId, ...payload },
        { onSuccess: () => resetForm() },
      );
      return;
    }

    createBanner.mutate(payload, { onSuccess: () => resetForm() });
  };

  const handleDelete = (banner) => {
    if (!window.confirm(`Delete "${banner.title || 'this banner'}"?`)) return;
    deleteBanner.mutate(banner.id, {
      onSuccess: () => {
        if (editingId === banner.id) resetForm();
      },
    });
  };

  return (
    <AdminLayout title="Hero Banners" breadcrumb="Hero Banners">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Landing Page Slider</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
            Add images here to control the sliding hero area on the home page.
          </p>
        </div>
        <div className="admin-badge admin-badge-warning">
          {sortedBanners.length} slides
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <form className="admin-card space-y-5 p-5" onSubmit={handleSubmit}>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingId ? 'Edit Banner' : 'Add Banner'}</h3>
              {editingId && (
                <button type="button" className="admin-link-button" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
            </div>

            <label className="admin-field-label">Image</label>
            <button
              type="button"
              className="admin-upload-zone !min-h-[240px]"
              onClick={() => document.getElementById('banner-image-input')?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) handleImageChange(file);
              }}
            >
              {imagePreview ? (
                <div className="w-full space-y-3">
                  <img
                    src={optimizeImage(imagePreview, 1200)}
                    alt="Banner preview"
                    className="mx-auto h-52 w-full rounded-2xl object-cover"
                  />
                  <span className="font-semibold">
                    {editingId ? 'Click to replace the image' : 'Click to change the image'}
                  </span>
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
              id="banner-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleImageChange(file);
                event.target.value = '';
              }}
            />
          </div>

          <div>
            <label className="admin-field-label">Title</label>
            <input
              className="admin-input"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Optional label"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-field-label">Sort Order</label>
              <input
                className="admin-input"
                type="number"
                value={form.sortOrder}
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
              />
            </div>
            <div>
              <label className="admin-field-label">Active</label>
              <button
                type="button"
                className={`admin-toggle ${form.isActive ? 'admin-toggle-on' : ''}`}
                onClick={() => setForm((current) => ({ ...current, isActive: !current.isActive }))}
                aria-pressed={form.isActive}
              >
                <span />
              </button>
            </div>
          </div>

          <div>
            <label className="admin-field-label">Link</label>
            <input
              className="admin-input"
              value={form.link}
              onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))}
              placeholder="/shop or https://example.com"
            />
          </div>

          <button className="admin-button admin-button-primary w-full" type="submit" disabled={createBanner.isPending || updateBanner.isPending}>
            {createBanner.isPending || updateBanner.isPending ? <Spinner size="sm" color="currentColor" /> : <Save size={16} />}
            {editingId ? 'Update Banner' : 'Create Banner'}
          </button>
        </form>

        <div className="admin-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold">Existing Banners</h3>
            {isLoading ? <Spinner size="sm" color="var(--admin-text)" /> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {sortedBanners.map((banner) => (
              <article key={banner.id} className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--admin-border)' }}>
                <img
                  src={optimizeImage(banner.imageUrl, 900)}
                  alt={banner.title || 'Banner'}
                  className="h-52 w-full object-cover"
                />
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold">{banner.title || 'Untitled banner'}</h4>
                      <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                        Order {banner.sortOrder} {banner.isActive ? '• Active' : '• Hidden'}
                      </p>
                    </div>
                    <div className={`admin-badge ${banner.isActive ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                      {banner.isActive ? 'Live' : 'Off'}
                    </div>
                  </div>

                  {banner.link ? (
                    <p className="truncate text-xs" style={{ color: 'var(--admin-muted)' }}>
                      {banner.link}
                    </p>
                  ) : null}

                  <div className="flex gap-2">
                    <button className="admin-button flex-1" type="button" onClick={() => startEdit(banner)}>
                      <PencilLine size={15} />
                      Edit
                    </button>
                    <button
                      className="admin-button admin-button-danger flex-1"
                      type="button"
                      onClick={() => handleDelete(banner)}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {!isLoading && sortedBanners.length === 0 && (
              <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-muted)' }}>
                No banners yet. Add the first slide to populate the home hero.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
