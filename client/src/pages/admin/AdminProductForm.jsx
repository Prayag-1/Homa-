import { Controller, useForm } from 'react-hook-form';
import {
  useBeforeUnload,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import DynamicList from '../../components/admin/ui/DynamicList';
import ImageUploadZone from '../../components/admin/ui/ImageUploadZone';
import MultiSelect from '../../components/admin/ui/MultiSelect';
import Spinner from '../../components/ui/Spinner';
import {
  usePublicBrands,
  usePublicCategories,
} from '../../hooks/useAdminBrandsCategories';
import {
  useAdminProduct,
  useCreateProduct,
  useUpdateProduct,
} from '../../hooks/useAdminProducts';

const SKIN_TYPES = ['Oily', 'Normal', 'Dry', 'Combination', 'Sensitive', 'Acne-Prone'];

const defaultValues = {
  name: '',
  sku: '',
  brand: '',
  category: '',
  description: '',
  ingredients: '',
  howToUse: '',
  benefits: [],
  certifications: [],
  skinTypes: [],
  price: '',
  comparePrice: '',
  stock: 0,
  isActive: true,
  isNewArrival: false,
  isBestSeller: false,
  seo: {
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    keywords: [],
    canonicalUrl: '',
  },
};

const toTextAreaValue = (value) => {
  if (Array.isArray(value)) return value.join('\n');
  return value || '';
};

const buildDefaultValues = (product) => ({
  ...defaultValues,
  name: product?.name || '',
  sku: product?.sku || '',
  brand: product?.brand || '',
  category: product?.category || '',
  description: product?.description || '',
  ingredients: toTextAreaValue(product?.ingredients),
  howToUse: product?.howToUse || '',
  benefits: product?.benefits || [],
  certifications: product?.certifications || [],
  skinTypes: product?.skinTypes || [],
  price: product?.price ?? '',
  comparePrice: product?.comparePrice ?? '',
  stock: product?.stock ?? 0,
  isActive: product?.isActive ?? true,
  isNewArrival: product?.isNewArrival ?? false,
  isBestSeller: product?.isBestSeller ?? false,
  seo: {
    metaTitle: product?.seo?.metaTitle || '',
    metaDescription: product?.seo?.metaDescription || '',
    focusKeyword: product?.seo?.focusKeyword || '',
    keywords: product?.seo?.keywords || [],
    canonicalUrl: product?.seo?.canonicalUrl || '',
  },
});

const hasSeoValue = (seo = {}) =>
  Boolean(
    seo.metaTitle
      || seo.metaDescription
      || seo.focusKeyword
      || seo.canonicalUrl
      || seo.keywords?.length,
  );

const getCounterColor = (count, limit, warningAt) => {
  if (count > limit) return '#FCA5A5';
  if (count >= warningAt) return '#FCD34D';
  return 'var(--admin-muted)';
};

function ToggleField({ checked, onChange, label, helper }) {
  return (
    <label className="admin-toggle-row">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs" style={{ color: 'var(--admin-muted)' }}>
          {helper}
        </span>
      </span>
      <button
        type="button"
        className={`admin-toggle ${checked ? 'admin-toggle-on' : ''}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span />
      </button>
    </label>
  );
}

function SeoAccordion({ isOpen, onToggle, children }) {
  return (
    <section className="border-t pt-5" style={{ borderColor: 'var(--admin-border)' }}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={onToggle}
      >
        <span className="text-sm font-bold">SEO & Search Optimization</span>
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {isOpen && <div className="mt-5 space-y-4">{children}</div>}
    </section>
  );
}

function KeywordsInput({ value = [], onChange, error }) {
  const [input, setInput] = useState('');
  const [localError, setLocalError] = useState('');
  const keywords = Array.isArray(value) ? value : [];

  const addKeyword = () => {
    const nextKeyword = input.trim();
    setLocalError('');

    if (!nextKeyword) return;
    if (nextKeyword.length > 50) {
      setLocalError('Keyword must be 50 characters or fewer.');
      return;
    }
    if (keywords.length >= 10) {
      setLocalError('Maximum 10 keywords allowed.');
      return;
    }
    if (keywords.some((keyword) => keyword.toLowerCase() === nextKeyword.toLowerCase())) {
      setLocalError('This keyword is already listed.');
      return;
    }

    onChange([...keywords, nextKeyword]);
    setInput('');
  };

  return (
    <div>
      <label className="admin-field-label" htmlFor="seo-keywords">Additional Keywords</label>
      <div className="mb-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
        Press Enter to add. Max 10 keywords.
      </div>
      <div className="mb-2 flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <span
            key={`${keyword}-${index}`}
            className="inline-flex min-h-[28px] items-center gap-2 border px-2 text-xs font-semibold"
            style={{ background: '#171A25', borderColor: 'var(--admin-border)', color: 'var(--admin-muted)' }}
          >
            {keyword}
            <button
              type="button"
              title="Remove"
              onClick={() => onChange(keywords.filter((_, keywordIndex) => keywordIndex !== index))}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        id="seo-keywords"
        className="admin-input"
        value={input}
        maxLength={50}
        disabled={keywords.length >= 10}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            addKeyword();
          }
        }}
      />
      <div className="mt-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
        {keywords.length}/10
      </div>
      {(localError || error) && <p className="admin-field-error">{localError || error}</p>}
    </div>
  );
}

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { data: product, isLoading } = useAdminProduct(id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(id);
  const { data: brands = [], isLoading: brandsLoading } = usePublicBrands();
  const { data: categories = [], isLoading: catsLoading } = usePublicCategories();
  const [imageState, setImageState] = useState({ newFiles: [], keepPublicIds: [], imageOrder: [] });
  const [imageDirty, setImageDirty] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [canonicalOpen, setCanonicalOpen] = useState(false);

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm({ defaultValues });

  useEffect(() => {
    if (isEdit && product) {
      reset(buildDefaultValues(product));
      setSeoOpen(hasSeoValue(product.seo));
      setCanonicalOpen(Boolean(product.seo?.canonicalUrl));
      setImageDirty(false);
    }
  }, [isEdit, product, reset]);

  const hasUnsavedChanges = isDirty || imageDirty;

  useBeforeUnload(
    useCallback((event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }, [hasUnsavedChanges]),
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    const handleDocumentClick = (event) => {
      const link = event.target.closest?.('a[href]');
      if (!link) return;

      const nextUrl = new URL(link.href, window.location.href);
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;

      if (nextUrl.origin !== window.location.origin || nextPath === currentPath) return;
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) return;

      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [hasUnsavedChanges]);

  const descriptionLength = watch('description')?.length || 0;
  const ingredientsLength = watch('ingredients')?.length || 0;
  const howToUseLength = watch('howToUse')?.length || 0;
  const productName = watch('name') || '';
  const productDescription = watch('description') || '';
  const metaTitleLength = watch('seo.metaTitle')?.length || 0;
  const metaDescriptionLength = watch('seo.metaDescription')?.length || 0;
  const isSubmitting = createProduct.isPending || updateProduct.isPending;
  const title = isEdit ? 'Edit Product' : 'Add Product';
  const breadcrumb = `Products > ${isEdit ? 'Edit Product' : 'Add Product'}`;

  const existingImages = useMemo(() => product?.images || [], [product?.images]);
  const activeBrands = useMemo(() => brands.filter((brand) => brand.isActive !== false), [brands]);
  const activeCategories = useMemo(() => categories.filter((category) => category.isActive !== false), [categories]);

  const handleImageChange = useCallback((nextState) => {
    setImageState(nextState);
    if (isEdit && product) {
      const originalIds = (product.images || []).map((image) => image.publicId).filter(Boolean);
      const changed = nextState.newFiles.length > 0
        || originalIds.length !== nextState.keepPublicIds.length
        || originalIds.some((publicId, index) => publicId !== nextState.keepPublicIds[index]);
      setImageDirty(changed);
    } else {
      setImageDirty(nextState.newFiles.length > 0);
    }
  }, [isEdit, product]);

  const appendFormData = (data) => {
    const fd = new FormData();
    fd.append('name', data.name);
    fd.append('sku', data.sku.toUpperCase());
    fd.append('brand', data.brand);
    fd.append('category', data.category);
    fd.append('description', data.description);
    fd.append('ingredients', data.ingredients || '');
    fd.append('howToUse', data.howToUse || '');
    fd.append('price', data.price);
    if (data.comparePrice) fd.append('comparePrice', data.comparePrice);
    fd.append('stock', data.stock);
    fd.append('isActive', data.isActive);
    fd.append('isNewArrival', data.isNewArrival);
    fd.append('isBestSeller', data.isBestSeller);
    fd.append('skinTypes', JSON.stringify(data.skinTypes));
    fd.append('benefits', JSON.stringify(data.benefits));
    fd.append('certifications', JSON.stringify(data.certifications));
    fd.append('seo', JSON.stringify({
      metaTitle: data.seo?.metaTitle || '',
      metaDescription: data.seo?.metaDescription || '',
      focusKeyword: data.seo?.focusKeyword || '',
      keywords: data.seo?.keywords || [],
      canonicalUrl: data.seo?.canonicalUrl || '',
    }));
    imageState.newFiles.forEach((file) => fd.append('images', file));
    fd.append('keepImages', JSON.stringify(imageState.keepPublicIds));
    fd.append('imageOrder', JSON.stringify(imageState.imageOrder || []));
    return fd;
  };

  const onSubmit = async (data) => {
    try {
      const fd = appendFormData(data);
      if (isEdit) {
        await updateProduct.mutateAsync(fd);
      } else {
        await createProduct.mutateAsync(fd);
      }
      reset(data);
      setImageDirty(false);
      navigate('/admin/products');
    } catch {
      // The mutation hooks already surface the API message with a toast.
    }
  };

  const confirmCancel = () => {
    if (!hasUnsavedChanges || window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      navigate('/admin/products');
    }
  };

  if (isEdit && isLoading) {
    return (
      <AdminLayout title={title} breadcrumb={breadcrumb}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[3fr_2fr]">
          <div className="admin-card space-y-4 p-5">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="admin-skeleton h-10" />
            ))}
          </div>
          <div className="admin-card space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="admin-skeleton h-16" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={title} breadcrumb={breadcrumb}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 lg:grid-cols-[3fr_2fr]">
        <div className="admin-card space-y-5 p-5">
          <div>
            <label className="admin-field-label" htmlFor="name">Product Name*</label>
            <input
              id="name"
              className="admin-input"
              {...register('name', { required: 'Product name is required.' })}
            />
            {errors.name && <p className="admin-field-error">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="admin-field-label" htmlFor="sku">SKU*</label>
              <input
                id="sku"
                className="admin-input font-mono uppercase"
                {...register('sku', { required: 'SKU is required.' })}
                onChange={(event) => setValue('sku', event.target.value.toUpperCase(), { shouldDirty: true, shouldValidate: true })}
              />
              {errors.sku && <p className="admin-field-error">{errors.sku.message}</p>}
            </div>
            <div>
              <label className="admin-field-label" htmlFor="brand">Brand*</label>
              <select
                id="brand"
                className="admin-select"
                disabled={brandsLoading}
                {...register('brand', { required: 'Brand is required.' })}
              >
                <option value="">{brandsLoading ? 'Loading brands...' : '- Select Brand -'}</option>
                {activeBrands.map((brand) => (
                  <option key={brand._id || brand.slug || brand.name} value={brand.name}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {errors.brand && <p className="admin-field-error">{errors.brand.message}</p>}
            </div>
          </div>

          <div>
            <label className="admin-field-label" htmlFor="category">Category*</label>
            <select
              id="category"
              className="admin-select"
              disabled={catsLoading}
              {...register('category', { required: 'Category is required.' })}
            >
              <option value="">{catsLoading ? 'Loading categories...' : '- Select Category -'}</option>
              {activeCategories.map((category) => (
                <option key={category._id || category.slug || category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category && <p className="admin-field-error">{errors.category.message}</p>}
          </div>

          <div>
            <label className="admin-field-label" htmlFor="description">Description*</label>
            <textarea
              id="description"
              className="admin-textarea min-h-[150px]"
              maxLength={5000}
              {...register('description', {
                required: 'Description is required.',
                minLength: { value: 10, message: 'Description must be at least 10 characters.' },
              })}
            />
            <div className="admin-char-count">{descriptionLength}/5000</div>
            {errors.description && <p className="admin-field-error">{errors.description.message}</p>}
          </div>

          <div>
            <label className="admin-field-label" htmlFor="ingredients">Ingredients</label>
            <textarea
              id="ingredients"
              className="admin-textarea"
              maxLength={5000}
              {...register('ingredients')}
            />
            <div className="admin-char-count">{ingredientsLength}/5000</div>
          </div>

          <div>
            <label className="admin-field-label" htmlFor="howToUse">How To Use</label>
            <textarea
              id="howToUse"
              className="admin-textarea"
              maxLength={2000}
              {...register('howToUse')}
            />
            <div className="admin-char-count">{howToUseLength}/2000</div>
          </div>

          <Controller
            name="benefits"
            control={control}
            render={({ field }) => (
              <DynamicList
                label="Benefits"
                placeholder="Add a benefit"
                maxItems={20}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name="certifications"
            control={control}
            render={({ field }) => (
              <DynamicList
                label="Certifications"
                placeholder="Add a certification"
                maxItems={10}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name="skinTypes"
            control={control}
            rules={{ validate: (value) => value?.length > 0 || 'Select at least one skin type.' }}
            render={({ field }) => (
              <MultiSelect
                label="Skin Types*"
                options={SKIN_TYPES}
                value={field.value}
                onChange={field.onChange}
                error={errors.skinTypes?.message}
              />
            )}
          />

          <SeoAccordion isOpen={seoOpen} onToggle={() => setSeoOpen((current) => !current)}>
            <div>
              <div className="flex items-end justify-between gap-3">
                <label className="admin-field-label mb-0" htmlFor="seo-meta-title">Meta Title</label>
                <button
                  type="button"
                  className="admin-link-button text-xs"
                  onClick={() => setValue('seo.metaTitle', `${productName} | HOMA Beauty`.slice(0, 60), { shouldDirty: true, shouldValidate: true })}
                >
                  Auto-fill from product name
                </button>
              </div>
              <input
                id="seo-meta-title"
                className="admin-input mt-2"
                maxLength={80}
                {...register('seo.metaTitle', {
                  maxLength: { value: 60, message: 'Meta title must be 60 characters or fewer.' },
                })}
              />
              <div className="mt-2 flex items-start justify-between gap-3 text-xs">
                <span style={{ color: 'var(--admin-muted)' }}>Shown in Google search results. Max 60 characters.</span>
                <span style={{ color: getCounterColor(metaTitleLength, 60, 50) }}>{metaTitleLength}/60</span>
              </div>
              {errors.seo?.metaTitle && <p className="admin-field-error">{errors.seo.metaTitle.message}</p>}
            </div>

            <div>
              <div className="flex items-end justify-between gap-3">
                <label className="admin-field-label mb-0" htmlFor="seo-meta-description">Meta Description</label>
                <button
                  type="button"
                  className="admin-link-button text-xs"
                  onClick={() => setValue('seo.metaDescription', productDescription.slice(0, 160), { shouldDirty: true, shouldValidate: true })}
                >
                  Auto-fill from description
                </button>
              </div>
              <textarea
                id="seo-meta-description"
                className="admin-textarea mt-2"
                maxLength={220}
                rows={3}
                {...register('seo.metaDescription', {
                  maxLength: { value: 160, message: 'Meta description must be 160 characters or fewer.' },
                })}
              />
              <div className="mt-2 flex items-start justify-between gap-3 text-xs">
                <span style={{ color: 'var(--admin-muted)' }}>Shown below the title in Google. Max 160 characters.</span>
                <span style={{ color: getCounterColor(metaDescriptionLength, 160, 150) }}>{metaDescriptionLength}/160</span>
              </div>
              {errors.seo?.metaDescription && <p className="admin-field-error">{errors.seo.metaDescription.message}</p>}
            </div>

            <div>
              <label className="admin-field-label" htmlFor="seo-focus-keyword">Focus Keyword</label>
              <input
                id="seo-focus-keyword"
                className="admin-input"
                maxLength={100}
                {...register('seo.focusKeyword', {
                  maxLength: { value: 100, message: 'Focus keyword must be 100 characters or fewer.' },
                })}
              />
              <div className="mt-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
                The main search term this product should rank for. Example: japanese hyaluronic acid serum nepal
              </div>
              {errors.seo?.focusKeyword && <p className="admin-field-error">{errors.seo.focusKeyword.message}</p>}
            </div>

            <Controller
              name="seo.keywords"
              control={control}
              rules={{
                validate: (value) => {
                  const keywords = Array.isArray(value) ? value : [];
                  if (keywords.length > 10) return 'Maximum 10 keywords allowed.';
                  return keywords.every((keyword) => keyword.length <= 50) || 'Each keyword must be 50 characters or fewer.';
                },
              }}
              render={({ field }) => (
                <KeywordsInput
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.seo?.keywords?.message}
                />
              )}
            />

            <div className="border-t pt-4" style={{ borderColor: 'var(--admin-border)' }}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setCanonicalOpen((current) => !current)}
              >
                <span className="text-sm font-bold">Canonical URL (Advanced)</span>
                {canonicalOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              {canonicalOpen && (
                <div className="mt-4">
                  <label className="admin-field-label" htmlFor="seo-canonical-url">Canonical URL (Advanced)</label>
                  <input
                    id="seo-canonical-url"
                    className="admin-input"
                    {...register('seo.canonicalUrl', {
                      validate: (value) => {
                        if (!value) return true;
                        try {
                          new URL(value);
                          return true;
                        } catch {
                          return 'Canonical URL must be a valid URL.';
                        }
                      },
                    })}
                  />
                  <div className="mt-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
                    Only set this if this product exists at another URL. Leave empty in most cases.
                  </div>
                  {errors.seo?.canonicalUrl && <p className="admin-field-error">{errors.seo.canonicalUrl.message}</p>}
                </div>
              )}
            </div>
          </SeoAccordion>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="admin-field-label" htmlFor="price">Price (NPR)*</label>
              <input
                id="price"
                type="number"
                min="1"
                className="admin-input"
                {...register('price', {
                  required: 'Price is required.',
                  min: { value: 1, message: 'Price must be at least 1.' },
                })}
              />
              {errors.price && <p className="admin-field-error">{errors.price.message}</p>}
            </div>
            <div>
              <label className="admin-field-label" htmlFor="comparePrice">Compare Price (NPR)</label>
              <input
                id="comparePrice"
                type="number"
                min="1"
                className="admin-input"
                {...register('comparePrice')}
              />
              <div className="mt-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
                Sale price shown to customers
              </div>
            </div>
            <div>
              <label className="admin-field-label" htmlFor="stock">Stock*</label>
              <input
                id="stock"
                type="number"
                min="0"
                step="1"
                className="admin-input"
                {...register('stock', {
                  required: 'Stock is required.',
                  min: { value: 0, message: 'Stock cannot be negative.' },
                  validate: (value) => Number.isInteger(Number(value)) || 'Stock must be an integer.',
                })}
              />
              {errors.stock && <p className="admin-field-error">{errors.stock.message}</p>}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="admin-card p-5">
            <ImageUploadZone existingImages={existingImages} onChange={handleImageChange} />
          </div>

          <div className="admin-card space-y-4 p-5">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <ToggleField
                  label="Active"
                  helper="Visible to customers"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="isNewArrival"
              control={control}
              render={({ field }) => (
                <ToggleField
                  label="New Arrival"
                  helper="Shown in New Arrivals section"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="isBestSeller"
              control={control}
              render={({ field }) => (
                <ToggleField
                  label="Best Seller"
                  helper="Shown in Best Sellers section"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="admin-card flex flex-col gap-3 p-5 sm:flex-row lg:flex-col">
            <button
              className="admin-button admin-button-primary flex-1"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" color="currentColor" /> : <Save size={16} />}
              {isEdit ? 'Save Changes' : 'Create Product'}
            </button>
            <button
              className="admin-button flex-1"
              type="button"
              onClick={confirmCancel}
              disabled={isSubmitting}
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </aside>
      </form>
    </AdminLayout>
  );
}
