import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CalendarClock,
  FileImage,
  FileText,
  Hash,
  RefreshCw,
  Upload,
  Tag,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  useBeforeUnload,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { z } from 'zod';
import AdminLayout from '../../../components/admin/AdminLayout';
import Spinner from '../../../components/ui/Spinner';
import { useAdminBlog, useCreateBlog, useUpdateBlog } from '../../../hooks/useAdminBlogs';
import {
  formatDateTimeLocal,
  parseDateTimeLocal,
  slugify,
} from '../../../services/blogApi';

const BLOG_CATEGORIES = [
  'Skincare Tips',
  'Cleansing',
  'Serums',
  'Moisturizers',
  'Sunscreen',
  'Acne Care',
  'Brightening',
  'Makeup Care',
];
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

const blogSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200, 'Title must be 200 characters or less'),
  slug: z.string().trim().min(1, 'Slug is required').max(220, 'Slug is too long').regex(SLUG_PATTERN, 'Slug must be URL-safe'),
  excerpt: z.string().trim().min(1, 'Excerpt is required').max(300, 'Excerpt must be 300 characters or less'),
  coverImage: z.string().trim().optional().or(z.literal('')).refine(isValidUrl, 'Cover image must be a valid URL'),
  categorySource: z.string().trim().min(1, 'Category is required'),
  customCategory: z.string().trim().optional().or(z.literal('')),
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
  coverImage: '',
  categorySource: 'Technology',
  customCategory: '',
  tags: [],
  content: '',
  status: 'draft',
  publishedAt: '',
};

const getCategorySource = (category = '') =>
  BLOG_CATEGORIES.includes(category) ? category : 'custom';

const resolveCategory = (values) =>
  values.categorySource === 'custom'
    ? values.customCategory.trim()
    : values.categorySource;

const formatAuthorName = (author) => {
  if (!author?.name) return 'Admin';
  return author.name;
};

function BlogFormSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
      <div className="space-y-4">
        <div className="admin-card p-5 space-y-4">
          <div className="admin-skeleton h-4 w-24" />
          <div className="admin-skeleton h-10 w-full" />
          <div className="admin-skeleton h-4 w-20" />
          <div className="admin-skeleton h-10 w-full" />
          <div className="admin-skeleton h-4 w-28" />
          <div className="admin-skeleton h-24 w-full" />
          <div className="admin-skeleton h-4 w-24" />
          <div className="admin-skeleton h-40 w-full" />
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
        <div className="admin-card p-5 space-y-4">
          <div className="admin-skeleton h-4 w-20" />
          <div className="admin-skeleton h-56 w-full" />
        </div>
      </div>
    </div>
  );
}

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

export default function BlogFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const slugAutoRef = useRef(true);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [tagDraft, setTagDraft] = useState('');

  const { data: blog, isLoading, isError, error, refetch } = useAdminBlog(id);
  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog(id);
  const mutation = isEditMode ? updateBlog : createBlog;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(blogSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const watchedTitle = useWatch({ control, name: 'title' });
  const watchedSlug = useWatch({ control, name: 'slug' });
  const watchedCoverImage = useWatch({ control, name: 'coverImage' });
  const watchedStatus = useWatch({ control, name: 'status' });
  const watchedTags = useWatch({ control, name: 'tags' }) || [];
  const watchedCategorySource = useWatch({ control, name: 'categorySource' });

  useBeforeUnload((event) => {
    if (!isDirty) return;
    event.preventDefault();
    event.returnValue = '';
  }, { capture: true });

  useEffect(() => {
    if (!isEditMode || !blog) return;

    slugAutoRef.current = true;
    reset({
      title: blog.title || '',
      slug: blog.slug || '',
      excerpt: blog.excerpt || '',
      coverImage: blog.coverImage || '',
      categorySource: getCategorySource(blog.category || ''),
      customCategory: BLOG_CATEGORIES.includes(blog.category || '') ? '' : (blog.category || ''),
      tags: Array.isArray(blog.tags) ? blog.tags : [],
      content: blog.content || '',
      status: blog.status || 'draft',
      publishedAt: blog.publishedAt ? formatDateTimeLocal(blog.publishedAt) : '',
    });
    setCoverImageFile(null);
    setCoverPreview(blog.coverImage || '');
    setTagDraft('');
  }, [blog, isEditMode, reset]);

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

    setCoverPreview(isValidUrl(watchedCoverImage) ? watchedCoverImage : '');
    return undefined;
  }, [coverImageFile, watchedCoverImage]);

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
    const status = mode;
    const resolvedCategory = resolveCategory(values);
    const resolvedPublishedAt = status === 'published'
      ? (parseDateTimeLocal(values.publishedAt) || new Date().toISOString())
      : null;

    const payload = {
      title: values.title.trim(),
      slug: values.slug.trim(),
      excerpt: values.excerpt.trim(),
      coverImage: values.coverImage?.trim() || '',
      category: resolvedCategory,
      tags: values.tags.map((tag) => tag.trim()).filter(Boolean),
      content: values.content.trim(),
      status,
      publishedAt: resolvedPublishedAt,
    };

    await mutation.mutateAsync({
      values: payload,
      coverImageFile,
    });

    navigate('/admin/blogs');
  };

  const saveDraft = handleSubmit((values) => submitForm(values, 'draft'));
  const publishBlog = handleSubmit((values) => submitForm(values, 'published'));

  const titleError = errors.title;
  const slugError = errors.slug;
  const excerptError = errors.excerpt;
  const coverImageError = errors.coverImage;
  const categoryError = errors.categorySource;
  const customCategoryError = errors.customCategory;
  const contentError = errors.content;
  const tagsError = errors.tags;
  const publishedAtError = errors.publishedAt;

  const loadingInitial = isEditMode && isLoading && !blog;

  return (
    <AdminLayout title={isEditMode ? 'Edit Blog' : 'New Blog'} breadcrumb="Blogs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            className="admin-button"
            type="button"
            onClick={() => navigate('/admin/blogs')}
          >
            <ArrowLeft size={16} />
            Back to blogs
          </button>
          <div className="mt-4">
            <h2 className="text-2xl font-bold">
              {isEditMode ? `Edit Blog` : 'Create Blog'}
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
              {isEditMode
                ? `Update ${formatAuthorName(blog?.author)}'s blog post and publish changes when ready.`
                : 'Draft a new blog post, refine its content, and publish it when ready.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="admin-button"
            type="button"
            onClick={() => navigate('/admin/blogs')}
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
            onClick={publishBlog}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Spinner size="sm" color="currentColor" />}
            Publish
          </button>
        </div>
      </div>

      {isError && (
        <div className="admin-card p-6">
          <div className="text-lg font-semibold">Unable to load blog</div>
          <div className="mt-2 text-sm" style={{ color: 'var(--admin-muted)' }}>
            {error?.response?.data?.message || error?.message || 'An unexpected error occurred.'}
          </div>
          <button className="admin-button admin-button-primary mt-4" type="button" onClick={() => refetch()}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {!isError && loadingInitial && <BlogFormSkeleton />}

      {!isError && !loadingInitial && (
        <form onSubmit={saveDraft}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
            <div className="space-y-6">
              <section className="admin-card p-5">
                <h3 className="mb-4 text-lg font-bold">Post Details</h3>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Title</label>
                  <input className="admin-input" type="text" placeholder="Enter blog title" {...register('title')} />
                  <FieldError error={titleError} />
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
                  <FieldError error={slugError} />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold">Excerpt</label>
                  <textarea
                    className="admin-input min-h-[120px] py-3"
                    maxLength={300}
                    placeholder="Short summary shown in blog cards"
                    {...register('excerpt')}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs" style={{ color: 'var(--admin-muted)' }}>
                    <span>Required. Keep it concise and informative.</span>
                    <span>{(watch('excerpt') || '').length}/300</span>
                  </div>
                  <FieldError error={excerptError} />
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-semibold">Content</label>
                    <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                      Simple textarea now, integrate the preferred rich text editor later.
                    </span>
                  </div>
                  <textarea
                    className="admin-input min-h-[320px] py-3"
                    placeholder="Write the full article content here..."
                    {...register('content')}
                  />
                  <FieldError error={contentError} />
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
                  <FieldError error={tagsError} />
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="admin-card p-5">
                <h3 className="mb-4 text-lg font-bold">Publishing</h3>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Category</label>
                  <select className="admin-select" {...register('categorySource')}>
                    {BLOG_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  <FieldError error={categoryError} />
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
                    <FieldError error={customCategoryError} />
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
                    <FieldError error={publishedAtError} />
                  </div>
                )}
              </section>

              <section className="admin-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FileImage size={16} className="text-[var(--admin-muted)]" />
                  <h3 className="text-lg font-bold">Cover Image</h3>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Image URL</label>
                  <input
                    className="admin-input"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    {...register('coverImage')}
                  />
                  <FieldError error={coverImageError} />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold">Upload File</label>
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
                    You can provide either a URL or upload a file. Uploaded files take precedence.
                  </p>
                </div>

                <div className="mt-5">
                  <div className="mb-2 text-sm font-semibold">Preview</div>
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden border border-[var(--admin-border)] bg-[#171A25]">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 px-6 text-center text-sm text-[var(--admin-muted)]">
                        <FileText size={24} />
                        <span>No cover image selected yet.</span>
                      </div>
                    )}
                  </div>
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
                    <span className="truncate text-right">{watchedTitle || 'Untitled blog'}</span>
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
                    <span style={{ color: 'var(--admin-muted)' }}>Author</span>
                    <span>{isEditMode ? formatAuthorName(blog?.author) : 'Admin'}</span>
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
