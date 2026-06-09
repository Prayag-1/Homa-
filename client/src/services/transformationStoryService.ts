import api from './api';

export const TRANSFORMATION_CATEGORIES = [
  'Acne',
  'Acne Scars',
  'Dark Spots',
  'Dullness',
  'Dryness',
  'Hyperpigmentation',
  'Sensitivity',
  'Texture',
] as const;

export type TransformationStatus = 'draft' | 'published';
export type AdminTransformationStatusFilter = 'all' | 'published' | 'draft';

export interface StoryImage {
  url: string;
  publicId: string | null;
}

export interface StoryAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

export interface TransformationStory {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  customerName: string;
  tags: string[];
  coverImage: StoryImage | null;
  beforeImage: StoryImage | null;
  afterImage: StoryImage | null;
  status: TransformationStatus;
  author: StoryAuthor;
  readTimeMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTransformationStoriesMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export interface PaginatedTransformationStories {
  data: TransformationStory[];
  meta: PaginatedTransformationStoriesMeta;
}

export interface TransformationStoryListParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}

export interface AdminTransformationStoryListParams extends TransformationStoryListParams {
  status?: AdminTransformationStatusFilter;
}

export interface TransformationStoryFormPayload {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  customerName?: string;
  tags: string[];
  status: TransformationStatus;
  publishedAt?: string | null;
  coverImageUrl?: string;
  coverImagePublicId?: string | null;
  beforeImageUrl?: string;
  beforeImagePublicId?: string | null;
  afterImageUrl?: string;
  afterImagePublicId?: string | null;
  coverImageFile?: File | null;
  beforeImageFile?: File | null;
  afterImageFile?: File | null;
}

export type CreateTransformationStoryPayload = TransformationStoryFormPayload;
export type UpdateTransformationStoryPayload = Partial<TransformationStoryFormPayload> & Pick<
  TransformationStoryFormPayload,
  'title' | 'slug' | 'excerpt' | 'content' | 'category' | 'tags' | 'status'
>;

const PUBLIC_BASE = '/transformations';
const ADMIN_BASE = '/admin/transformations';

const unwrap = <T>(response: { data?: { data?: T } }) => response?.data?.data;

const cleanParams = <T extends Record<string, unknown>>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) =>
      value !== undefined && value !== null && value !== '' && value !== 'all',
    ),
  ) as Partial<T>;

const toDateString = (value: unknown) => {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizeImage = (image: unknown): StoryImage | null => {
  if (!image || typeof image !== 'object') return null;
  const candidate = image as { url?: string; publicId?: string | null };
  if (!candidate.url) return null;
  return {
    url: candidate.url,
    publicId: candidate.publicId || null,
  };
};

const normalizeStory = (story: Partial<TransformationStory> & Record<string, unknown> = {}): TransformationStory => {
  const rawStatus =
    story.status ||
    (story.isPublished ? 'published' : 'draft');

  const author = story.author && typeof story.author === 'object'
    ? {
        id: String((story.author as { id?: string; _id?: string }).id || (story.author as { id?: string; _id?: string })._id || ''),
        name: (story.author as { name?: string }).name || 'Admin',
        avatar: (story.author as { avatar?: string | null }).avatar || null,
      }
    : {
        id: '',
        name: 'Admin',
        avatar: null,
      };

  return {
    id: String(story.id || story._id || ''),
    title: String(story.title || ''),
    slug: String(story.slug || ''),
    excerpt: String(story.excerpt || ''),
    content: String(story.content || ''),
    category: String(story.category || ''),
    customerName: String(story.customerName || ''),
    tags: Array.isArray(story.tags) ? story.tags.map((tag) => String(tag)) : [],
    coverImage: normalizeImage(story.coverImage),
    beforeImage: normalizeImage(story.beforeImage),
    afterImage: normalizeImage(story.afterImage),
    status: rawStatus === 'published' ? 'published' : 'draft',
    author,
    readTimeMinutes: Number(story.readTimeMinutes || 0),
    publishedAt: toDateString(story.publishedAt),
    createdAt: toDateString(story.createdAt) || new Date().toISOString(),
    updatedAt: toDateString(story.updatedAt) || new Date().toISOString(),
  };
};

const normalizePaginatedStories = (payload: any): PaginatedTransformationStories => {
  const items = payload?.data || payload?.items || [];
  const meta = payload?.meta || {
    currentPage: payload?.page || 1,
    totalPages: payload?.totalPages || 1,
    totalCount: payload?.total || items.length || 0,
    limit: payload?.limit || 10,
  };

  return {
    data: items.map(normalizeStory),
    meta,
  };
};

export const buildTransformationStoryFormData = (
  values: Partial<TransformationStoryFormPayload> = {},
  files: Partial<Pick<TransformationStoryFormPayload, 'coverImageFile' | 'beforeImageFile' | 'afterImageFile'>> = {},
) => {
  const formData = new FormData();

  const entries: Record<string, unknown> = {
    title: values.title,
    slug: values.slug,
    excerpt: values.excerpt,
    content: values.content,
    category: values.category,
    customerName: values.customerName,
    status: values.status,
    publishedAt: values.publishedAt,
    coverImageUrl: values.coverImageUrl,
    coverImagePublicId: values.coverImagePublicId,
    beforeImageUrl: values.beforeImageUrl,
    beforeImagePublicId: values.beforeImagePublicId,
    afterImageUrl: values.afterImageUrl,
    afterImagePublicId: values.afterImagePublicId,
    tags: JSON.stringify(values.tags || []),
  };

  Object.entries(entries).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, String(value));
    }
  });

  const coverFile = files.coverImageFile || values.coverImageFile || null;
  const beforeFile = files.beforeImageFile || values.beforeImageFile || null;
  const afterFile = files.afterImageFile || values.afterImageFile || null;

  if (coverFile) formData.append('coverImageFile', coverFile);
  if (beforeFile) formData.append('beforeImageFile', beforeFile);
  if (afterFile) formData.append('afterImageFile', afterFile);

  return formData;
};

export async function fetchPublishedTransformationStories(params: TransformationStoryListParams): Promise<PaginatedTransformationStories> {
  const response = await api.get(PUBLIC_BASE, {
    params: cleanParams(params),
  });
  return normalizePaginatedStories(unwrap(response));
}

export async function fetchTransformationStoryBySlug(slug: string): Promise<TransformationStory> {
  const response = await api.get(`${PUBLIC_BASE}/${slug}`);
  return normalizeStory(unwrap(response));
}

export async function fetchRelatedTransformationStories(slug: string): Promise<TransformationStory[]> {
  const response = await api.get(`${PUBLIC_BASE}/${slug}/related`);
  const payload = unwrap(response);
  return Array.isArray(payload) ? payload.map(normalizeStory) : [];
}

export async function fetchAdminTransformationStories(params: AdminTransformationStoryListParams): Promise<PaginatedTransformationStories> {
  const response = await api.get(ADMIN_BASE, {
    params: cleanParams(params),
  });
  return normalizePaginatedStories(unwrap(response));
}

export async function fetchAdminTransformationStoryById(id: string): Promise<TransformationStory> {
  const response = await api.get(`${ADMIN_BASE}/${id}`);
  return normalizeStory(unwrap(response));
}

export async function createTransformationStory(payload: CreateTransformationStoryPayload): Promise<TransformationStory> {
  const response = await api.post(ADMIN_BASE, buildTransformationStoryFormData(payload));
  return normalizeStory(unwrap(response));
}

export async function updateTransformationStory(id: string, payload: UpdateTransformationStoryPayload): Promise<TransformationStory> {
  const response = await api.put(`${ADMIN_BASE}/${id}`, buildTransformationStoryFormData(payload));
  return normalizeStory(unwrap(response));
}

export async function deleteTransformationStory(id: string): Promise<void> {
  await api.delete(`${ADMIN_BASE}/${id}`);
}

export async function togglePublishTransformationStory(id: string): Promise<TransformationStory> {
  const response = await api.patch(`${ADMIN_BASE}/${id}/publish`);
  return normalizeStory(unwrap(response));
}
