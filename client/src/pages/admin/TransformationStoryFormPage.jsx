import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CalendarClock,
  FileImage,
  Hash,
  ImagePlus,
  RefreshCw,
  Tag,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useBeforeUnload, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import AdminLayout from '../../components/admin/AdminLayout';
import Spinner from '../../components/ui/Spinner';
import { TRANSFORMATION_CATEGORIES } from '../../services/transformationStoryService';
import {
  useAdminTransformationStory,
  useCreateTransformationStory,
  useUpdateTransformationStory,
} from '../../hooks/useTransformationStory';
import { parseDateTimeLocal, formatDateTimeLocal, slugify } from '../../services/blogApi';

const SLUG_PATTERN = /^[-a-z0-9]+(?:-[-a-z0-9]+)*$/;

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const storySchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200, 'Title must be 200 characters or less'),
  slug: z.string().trim().min(1, 'Slug is required').max(220, 'Slug is too long').regex(SLUG_PATTERN, 'Slug must be URL-safe'),
  excerpt: z.string().trim().min(1, 'Excerpt is required').max(300, 'Excerpt must be 300 characters or less'),
  categorySource: z.string().trim().min(1, 'Category is required'),
  customCategory: z.string().trim().optional().or(z.literal('')),
  customerName: z.string().trim().optional().or(z.literal('')),
  coverImageUrl: z.string().trim().optional().or(z.literal('')).refine(isValidUrl, 'Cover image must be a valid URL'),
  coverImagePublicId: z.string().trim().optional().or(z.literal('')),
  beforeImageUrl: z.string().trim().optional().or(z.literal('')).refine(isValidUrl, 'Before image must be a valid URL'),
  beforeImagePublicId: z.string().trim().optional().or(z.literal('')),
  afterImageUrl: z.string().trim().optional().or(z.literal('')).refine(isValidUrl, 'After image must be a valid URL'),
  afterImagePublicId: z.string().trim().optional().or(z.literal('')),
  tags: z.array(z.string().trim()).max(10, 'You can add up to 10 tags'),
  content: z.string().trim().min(1, 'Content is required'),
  status: z.enum(['draft', 'published']),
  publishedAt: z.string().trim().optional().or(z.literal('')).nullable(),
}).superRefine((values, ctx) => {
  if (values.categorySource === 'custom' && !values.customCategory?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['customCategory'],
      message: 'Please enter a custom category',
    });
  }
});

const DEFAULT_VALUES = {
  title: '',
  slug: '',
  excerpt: '',
  categorySource: 'Acne',
  customCategory: '',
  customerName: '',
  coverImageUrl: '',
  coverImagePublicId: '',
  beforeImageUrl: '',
  beforeImagePublicId: '',
  afterImageUrl: '',
  afterImagePublicId: '',
  tags: [],
  content: '',
  status: 'draft',
  publishedAt: '',
};

const getCategorySource = (category = '') =>
  TRANSFORMATION_CATEGORIES.includes(category) ? category : 'custom';

const resolveCategory = (values) =>
  values.categorySource === 'custom'
    ? values.customCategory.trim()
    : values.categorySource;

function FieldError({ error }) {
  if (!error) return null;
  return <p className="mt-2 text-xs font-medium text-[var(--admin-error)]">{error.message}</p>;
}

function Chip({ children, onRemove, disabled }) {
  return (
    <span className="inline-flex items-center gap-2 border border-[var(--admin-border)] bg-[#171A25] px-3 py-1 text-xs font-semibold text-[var(--admin-text)]">
      {children}
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-text)] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${children}`}
      >
        <X size={11} />
      </button>
    </span>
  );
}

function ImagePreview({ label, value, fallback = 'No image selected yet.' }) {
  return (
    <div className="overflow-hidden border border-[var(--admin-border)] bg-[#171A25]">
      <div className="border-b border-[var(--admin-border)] px-4 py-2 text-sm font-semibold">{label}</div>
      <div className="flex aspect-[4/3] items-center justify-center">
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center text-sm text-[var(--admin-muted)]">
            <FileImage size={24} />
            <span>{fallback}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TransformationStoryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const slugAutoRef = useRef(true);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [beforeImageFile, setBeforeImageFile] = useState(null);
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [beforePreview, setBeforePreview] = useState('');
  const [afterPreview, setAfterPreview] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [formError, setFormError] = useState('');

  const { data: story, isLoading, isError, error, refetch } = useAdminTransformationStory(id);
  const createStory = useCreateTransformationStory();
  const updateStory = useUpdateTransformationStory(id);
  const mutation = isEditMode ? updateStory : createStory;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(storySchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const watchedTitle = useWatch({ control, name: 'title' });
  const watchedSlug = useWatch({ control, name: 'slug' });
  const watchedStatus = useWatch({ control, name: 'status' });
  const watchedTags = useWatch({ control, name: 'tags' }) || [];
  const watchedCategorySource = useWatch({ control, name: 'categorySource' });
  const watchedCoverUrl = useWatch({ control, name: 'coverImageUrl' });
  const watchedBeforeUrl = useWatch({ control, name: 'beforeImageUrl' });
  const watchedAfterUrl = useWatch({ control, name: 'afterImageUrl' });

  useBeforeUnload((event) => {
    if (!isDirty) return;
    event.preventDefault();
    event.returnValue = '';
  }, { capture: true });

  useEffect(() => {
    if (!isEditMode || !story) return;

    slugAutoRef.current = true;
    reset({
      title: story.title || '',
      slug: story.slug || '',
      excerpt: story.excerpt || '',
      categorySource: getCategorySource(story.category || ''),
      customCategory: TRANSFORMATION_CATEGORIES.includes(story.category || '') ? '' : (story.category || ''),
      customerName: story.customerName || '',
      coverImageUrl: story.coverImage?.url || '',
      coverImagePublicId: story.coverImage?.publicId || '',
      beforeImageUrl: story.beforeImage?.url || '',
      beforeImagePublicId: story.beforeImage?.publicId || '',
      afterImageUrl: story.afterImage?.url || '',
      afterImagePublicId: story.afterImage?.publicId || '',
      tags: Array.isArray(story.tags) ? story.tags : [],
      content: story.content || '',
      status: story.status || 'draft',
      publishedAt: story.publishedAt ? formatDateTimeLocal(story.publishedAt) : '',
    });
    setCoverImageFile(null);
    setBeforeImageFile(null);
    setAfterImageFile(null);
    setCoverPreview(story.coverImage?.url || story.afterImage?.url || story.beforeImage?.url || '');
    setBeforePreview(story.beforeImage?.url || '');
    setAfterPreview(story.afterImage?.url || '');
    setTagDraft('');
    setFormError('');
  }, [story, isEditMode, reset]);

  useEffect(() => {
    if (watchedCategorySource !== 'custom') {
      setValue('customCategory', '', { shouldDirty: true, shouldValidate: true });
    }
  }, [setValue, watchedCategorySource]);

  useEffect(() => {
    if (!slugAutoRef.current) return undefined;

    const timer = window.setTimeout(() => {
      setValue('slug', slugify(watchedTitle || ''), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [setValue, watchedTitle]);

  useEffect(() => {
    if (coverImageFile) {
      const objectUrl = URL.createObjectURL(coverImageFile);
      setCoverPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setCoverPreview(watchedCoverUrl || afterPreview || beforePreview || '');
    return undefined;
  }, [afterPreview, beforePreview, coverImageFile, watchedCoverUrl]);

  useEffect(() => {
    if (beforeImageFile) {
      const objectUrl = URL.createObjectURL(beforeImageFile);
      setBeforePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setBeforePreview(watchedBeforeUrl || '');
    return undefined;
  }, [beforeImageFile, watchedBeforeUrl]);

  useEffect(() => {
    if (afterImageFile) {
      const objectUrl = URL.createObjectURL(afterImageFile);
      setAfterPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setAfterPreview(watchedAfterUrl || '');
    return undefined;
  }, [afterImageFile, watchedAfterUrl]);

  const addTag = (rawValue) => {
    const nextTag = rawValue.trim().replace(/,+$/, '');
    if (!nextTag) return;

    const normalized = nextTag.toLowerCase();
    const existing = watchedTags.map((tag) => tag.toLowerCase());
    if (existing.includes(normalized) || watchedTags.length >= 10) return;

    setValue('tags', [...watchedTags, nextTag], { shouldDirty: true, shouldValidate: true });
  };

  const removeTag = (tagToRemove) => {
    setValue(
      'tags',
      watchedTags.filter((tag) => tag !== tagToRemove),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const handleTagKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(tagDraft);
      setTagDraft('');
    }
  };

  const submitForm = async (values, mode) => {
    setFormError('');
    const status = mode;
    const resolvedCategory = resolveCategory(values);
    const resolvedPublishedAt = status === 'published'
      ? (parseDateTimeLocal(values.publishedAt) || new Date().toISOString())
      : null;

    const beforeResolved = beforeImageFile || values.beforeImageUrl;
    const afterResolved = afterImageFile || values.afterImageUrl;

    if (!beforeResolved) {
      setFormError('Before image is required.');
      return;
    }

    if (!afterResolved) {
      setFormError('After image is required.');
      return;
    }

    const payload = {
      title: values.title.trim(),
      slug: values.slug.trim(),
      excerpt: values.excerpt.trim(),
      category: resolvedCategory,
      customerName: values.customerName?.trim() || '',
      coverImageUrl: values.coverImageUrl?.trim() || '',
      coverImagePublicId: values.coverImagePublicId?.trim() || '',
      beforeImageUrl: values.beforeImageUrl?.trim() || '',
      beforeImagePublicId: values.beforeImagePublicId?.trim() || '',
      afterImageUrl: values.afterImageUrl?.trim() || '',
      afterImagePublicId: values.afterImagePublicId?.trim() || '',
      tags: values.tags.map((tag) => tag.trim()).filter(Boolean),
      content: values.content.trim(),
      status,
      publishedAt: resolvedPublishedAt,
    };

    await mutation.mutateAsync({
      values: payload,
      coverImageFile,
      beforeImageFile,
      afterImageFile,
    });

    navigate('/admin/transformations');
  };

  const saveDraft = handleSubmit((values) => submitForm(values, 'draft'));
  const publishStory = handleSubmit((values) => submitForm(values, 'published'));

  const loadingInitial = isEditMode && isLoading && !story;

  return (
    <AdminLayout title={isEditMode ? 'Edit Story' : 'New Story'} breadcrumb="Transformation Stories">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            className="admin-button"
            type="button"
            onClick={() => navigate('/admin/transformations')}
          >
            <ArrowLeft size={16} />
            Back to stories
          </button>
          <div className="mt-4">
            <h2 className="text-2xl font-bold">
              {isEditMode ? 'Edit Transformation Story' : 'Create Transformation Story'}
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
              {isEditMode
                ? 'Update the story copy, category, and images when the result changes.'
                : 'Publish a real before-and-after story that builds trust with your customers.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="admin-button"
            type="button"
            onClick={() => navigate('/admin/transformations')}
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            className="admin-button"
            type="button"
            onClick={saveDraft}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Spinner size="sm" color="currentColor" />}
            Save as Draft
          </button>
          <button
            className="admin-button admin-button-primary"
            type="button"
            onClick={publishStory}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Spinner size="sm" color="currentColor" />}
            Publish
          </button>
        </div>
      </div>

      {isError && (
        <div className="admin-card p-6">
          <div className="text-lg font-semibold">Unable to load transformation story</div>
          <div className="mt-2 text-sm" style={{ color: 'var(--admin-muted)' }}>
            {error?.response?.data?.message || error?.message || 'An unexpected error occurred.'}
          </div>
          <button className="admin-button admin-button-primary mt-4" type="button" onClick={() => refetch()}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {!isError && loadingInitial && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <div className="admin-card p-5 space-y-4">
              <div className="admin-skeleton h-4 w-24" />
              <div className="admin-skeleton h-10 w-full" />
              <div className="admin-skeleton h-4 w-20" />
              <div className="admin-skeleton h-10 w-full" />
              <div className="admin-skeleton h-4 w-28" />
              <div className="admin-skeleton h-24 w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="admin-card p-5 space-y-4">
              <div className="admin-skeleton h-4 w-28" />
              <div className="admin-skeleton h-10 w-full" />
              <div className="admin-skeleton h-10 w-full" />
              <div className="admin-skeleton h-10 w-full" />
              <div className="admin-skeleton h-10 w-full" />
            </div>
          </div>
        </div>
      )}

      {!isError && !loadingInitial && (
        <form onSubmit={saveDraft}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
            <div className="space-y-6">
              <section className="admin-card p-5">
                <h3 className="mb-4 text-lg font-bold">Story Details</h3>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Title</label>
                  <input className="admin-input" type="text" placeholder="Enter story title" {...register('title')} />
                  <FieldError error={errors.title} />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold">Slug</label>
                  <div className="relative">
                    <Hash size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
                    <input
                      className="admin-input pl-9"
                      type="text"
                      placeholder="url-safe-slug"
                      {...register('slug', {
                        onChange: () => {
                          slugAutoRef.current = false;
                        },
                      })}
                    />
                  </div>
                  <p className="mt-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
                    Auto-generated from the title. You can edit it manually.
                  </p>
                  <FieldError error={errors.slug} />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold">Customer name</label>
                  <div className="relative">
                    <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
                    <input className="admin-input pl-9" type="text" placeholder="Verified customer" {...register('customerName')} />
                  </div>
                  <p className="mt-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
                    Optional. Leave blank if the story should stay anonymous.
                  </p>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold">Excerpt</label>
                  <textarea
                    className="admin-input min-h-[120px] py-3"
                    maxLength={300}
                    placeholder="Short summary shown in story cards"
                    {...register('excerpt')}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs" style={{ color: 'var(--admin-muted)' }}>
                    <span>Required. Keep it concise and informative.</span>
                    <span>{(watch('excerpt') || '').length}/300</span>
                  </div>
                  <FieldError error={errors.excerpt} />
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-semibold">Content</label>
                    <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                      Use plain text or paste formatted HTML.
                    </span>
                  </div>
                  <textarea
                    className="admin-input min-h-[320px] py-3"
                    placeholder="Describe the routine, timeline, and skin result..."
                    {...register('content')}
                  />
                  <FieldError error={errors.content} />
                </div>
              </section>

              <section className="admin-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Tag size={16} className="text-[var(--admin-muted)]" />
                  <h3 className="text-lg font-bold">Tags</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {watchedTags.map((tag) => (
                    <Chip key={tag} onRemove={() => removeTag(tag)} disabled={mutation.isPending}>
                      {tag}
                    </Chip>
                  ))}
                  {watchedTags.length === 0 && (
                    <span className="text-sm" style={{ color: 'var(--admin-muted)' }}>
                      No tags added yet.
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <input
                    className="admin-input"
                    type="text"
                    placeholder="Type a tag and press Enter"
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={handleTagKeyDown}
                    disabled={watchedTags.length >= 10 || mutation.isPending}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs" style={{ color: 'var(--admin-muted)' }}>
                    <span>Optional. Use up to 10 tags.</span>
                    <span>{watchedTags.length}/10</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="admin-card p-5">
                <h3 className="mb-4 text-lg font-bold">Publishing</h3>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Category</label>
                  <select className="admin-select" {...register('categorySource')}>
                    {TRANSFORMATION_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  <FieldError error={errors.categorySource} />
                </div>

                {watchedCategorySource === 'custom' && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold">Custom Category</label>
                    <input
                      className="admin-input"
                      type="text"
                      placeholder="Enter a category"
                      {...register('customCategory')}
                    />
                    <FieldError error={errors.customCategory} />
                  </div>
                )}

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'draft', label: 'Draft' },
                      { value: 'published', label: 'Published' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center justify-center border px-3 py-2 text-sm font-semibold transition-colors ${
                          watchedStatus === option.value
                            ? 'border-[var(--admin-accent)] bg-[#24283A] text-[var(--admin-text)]'
                            : 'border-[var(--admin-border)] bg-[#171A25] text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
                        }`}
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          value={option.value}
                          {...register('status')}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>

                {watchedStatus === 'published' && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold">Publish Date</label>
                    <div className="relative">
                      <CalendarClock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
                      <input className="admin-input pl-9" type="datetime-local" {...register('publishedAt')} />
                    </div>
                    <p className="mt-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
                      Optional. Leave blank to publish immediately.
                    </p>
                  </div>
                )}
              </section>

              <section className="admin-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FileImage size={16} className="text-[var(--admin-muted)]" />
                  <h3 className="text-lg font-bold">Cover Image</h3>
                </div>

                <div className="relative">
                  <input
                    className="admin-input pt-[7px]"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setCoverImageFile(event.target.files?.[0] || null)}
                    disabled={mutation.isPending}
                  />
                  <Upload size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
                </div>
                <p className="mt-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
                  Optional. If omitted, the after image will be used as the story cover.
                </p>
              </section>

              <section className="admin-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ImagePlus size={16} className="text-[var(--admin-muted)]" />
                  <h3 className="text-lg font-bold">Before & After</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Before image</label>
                    <div className="relative">
                      <input
                        className="admin-input pt-[7px]"
                        type="file"
                        accept="image/*"
                        onChange={(event) => setBeforeImageFile(event.target.files?.[0] || null)}
                        disabled={mutation.isPending}
                      />
                      <Upload size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">After image</label>
                    <div className="relative">
                      <input
                        className="admin-input pt-[7px]"
                        type="file"
                        accept="image/*"
                        onChange={(event) => setAfterImageFile(event.target.files?.[0] || null)}
                        disabled={mutation.isPending}
                      />
                      <Upload size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
                    </div>
                  </div>
                </div>
                {formError && <p className="admin-field-error mt-3">{formError}</p>}
              </section>

              <section className="admin-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Image Preview</h3>
                  <span className={`admin-badge ${watchedStatus === 'published' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                    {watchedStatus === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="space-y-4">
                  <ImagePreview label="Cover" value={coverPreview} fallback="Optional cover image." />
                  <ImagePreview label="Before" value={beforePreview} fallback="Before image required." />
                  <ImagePreview label="After" value={afterPreview} fallback="After image required." />
                </div>
              </section>

              <section className="admin-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Summary</h3>
                  <span className={`admin-badge ${watchedStatus === 'published' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                    {watchedStatus === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: 'var(--admin-muted)' }}>Title</span>
                    <span className="truncate text-right">{watchedTitle || 'Untitled story'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: 'var(--admin-muted)' }}>Slug</span>
                    <span className="truncate text-right font-mono text-xs">{watchedSlug || 'not-generated-yet'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: 'var(--admin-muted)' }}>Category</span>
                    <span className="truncate text-right">
                      {watchedCategorySource === 'custom'
                        ? watch('customCategory') || 'Custom'
                        : watchedCategorySource}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: 'var(--admin-muted)' }}>Tags</span>
                    <span>{watchedTags.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: 'var(--admin-muted)' }}>Customer</span>
                    <span className="truncate text-right">{watch('customerName') || 'Anonymous'}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
