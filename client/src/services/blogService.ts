import api from './api';

export const BLOG_CATEGORIES = [
  'Technology',
  'News',
  'Tutorial',
  'Guides',
  'Product Updates',
  'Announcements',
] as const;

export type BlogStatus = 'draft' | 'published';
export type AdminBlogStatusFilter = 'all' | 'published' | 'draft';

export interface BlogAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  status: BlogStatus;
  author: BlogAuthor;
  readTimeMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedBlogsMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export interface PaginatedBlogs {
  data: Blog[];
  meta: PaginatedBlogsMeta;
}

export interface BlogListParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}

export interface AdminBlogListParams {
  page: number;
  limit: number;
  search?: string;
  status?: AdminBlogStatusFilter;
}

export interface BlogFormPayload {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: BlogStatus;
  publishedAt?: string | null;
  coverImage?: string;
  coverImageFile?: File | null;
}

export type CreateBlogPayload = BlogFormPayload;
export type UpdateBlogPayload = Partial<BlogFormPayload> & Pick<BlogFormPayload, 'title' | 'slug' | 'excerpt' | 'content' | 'category' | 'tags' | 'status'>;

const BLOG_BASE = '/blogs';
const ADMIN_BLOG_BASE = '/admin/blogs';

const SLUG_PATTERN = /^[-a-z0-9]+(?:-[-a-z0-9]+)*$/;

const cleanParams = <T extends Record<string, unknown>>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) =>
      value !== undefined && value !== null && value !== '' && value !== 'all',
    ),
  ) as Partial<T>;

const unwrap = <T>(response: { data?: { data?: T } }) => response?.data?.data;

const toDateString = (value: unknown) => {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const isValidSlug = (value = '') => SLUG_PATTERN.test(value);

export const formatDateTimeLocal = (value: string | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

export const parseDateTimeLocal = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const normalizeBlog = (blog: Partial<Blog> & Record<string, unknown> = {}): Blog => {
  const rawStatus =
    blog.status ||
    (blog.isPublished ? 'published' : 'draft');

  const author = blog.author && typeof blog.author === 'object'
    ? {
        id: String((blog.author as { id?: string; _id?: string }).id || (blog.author as { id?: string; _id?: string })._id || ''),
        name: (blog.author as { name?: string }).name || 'Admin',
        avatar: (blog.author as { avatar?: string | null }).avatar || null,
      }
    : {
        id: '',
        name: 'Admin',
        avatar: null,
      };

  return {
    id: String(blog.id || blog._id || ''),
    title: String(blog.title || ''),
    slug: String(blog.slug || ''),
    excerpt: String(blog.excerpt || ''),
    content: String(blog.content || ''),
    coverImage: (blog.coverImage as string | null) || null,
    category: String(blog.category || ''),
    tags: Array.isArray(blog.tags) ? blog.tags.map((tag) => String(tag)) : [],
    status: rawStatus === 'published' ? 'published' : 'draft',
    author,
    readTimeMinutes: Number(blog.readTimeMinutes || blog.readTime || 0),
    publishedAt: toDateString(blog.publishedAt),
    createdAt: toDateString(blog.createdAt) || new Date().toISOString(),
    updatedAt: toDateString(blog.updatedAt) || new Date().toISOString(),
  };
};

const normalizePaginatedBlogs = (payload: any): PaginatedBlogs => {
  const items = payload?.data || payload?.items || [];
  const meta = payload?.meta || {
    currentPage: payload?.page || 1,
    totalPages: payload?.totalPages || 1,
    totalCount: payload?.total || items.length || 0,
    limit: payload?.limit || 10,
  };

  return {
    data: items.map(normalizeBlog),
    meta,
  };
};

export const buildBlogFormData = (values: Partial<BlogFormPayload> = {}, coverImageFile: File | null = null) => {
  const formData = new FormData();
  const entries: Record<string, unknown> = {
    title: values.title,
    slug: values.slug,
    excerpt: values.excerpt,
    content: values.content,
    category: values.category,
    status: values.status,
    publishedAt: values.publishedAt,
    coverImage: values.coverImage,
    tags: JSON.stringify(values.tags || []),
  };

  Object.entries(entries).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, String(value));
    }
  });

  const file = coverImageFile || values.coverImageFile || null;
  if (file) {
    formData.append('coverImageFile', file);
  }

  return formData;
};

export async function fetchPublishedBlogs(params: BlogListParams): Promise<PaginatedBlogs> {
  const response = await api.get(BLOG_BASE, {
    params: cleanParams({ ...params, status: 'published' }),
  });
  return normalizePaginatedBlogs(unwrap(response));
}

export async function fetchBlogBySlug(slug: string): Promise<Blog> {
  const response = await api.get(`${BLOG_BASE}/${slug}`);
  return normalizeBlog(unwrap(response));
}

export async function fetchAdminBlogs(params: AdminBlogListParams): Promise<PaginatedBlogs> {
  const response = await api.get(ADMIN_BLOG_BASE, {
    params: cleanParams(params),
  });
  return normalizePaginatedBlogs(unwrap(response));
}

export async function fetchAdminBlogById(id: string): Promise<Blog> {
  const response = await api.get(`${ADMIN_BLOG_BASE}/${id}`);
  return normalizeBlog(unwrap(response));
}

export async function createBlog(payload: CreateBlogPayload): Promise<Blog> {
  const response = await api.post(ADMIN_BLOG_BASE, buildBlogFormData(payload));
  return normalizeBlog(unwrap(response));
}

export async function updateBlog(id: string, payload: UpdateBlogPayload): Promise<Blog> {
  const response = await api.put(`${ADMIN_BLOG_BASE}/${id}`, buildBlogFormData(payload));
  return normalizeBlog(unwrap(response));
}

export async function deleteBlog(id: string): Promise<void> {
  await api.delete(`${ADMIN_BLOG_BASE}/${id}`);
}

export async function togglePublishBlog(id: string): Promise<Blog> {
  const response = await api.patch(`${ADMIN_BLOG_BASE}/${id}/publish`);
  return normalizeBlog(unwrap(response));
}

export {
  fetchPublishedBlogs as getBlogs,
  fetchBlogBySlug as getBlogBySlug,
  fetchAdminBlogs as adminGetBlogs,
  fetchAdminBlogById as adminGetBlogById,
  createBlog as adminCreateBlog,
  updateBlog as adminUpdateBlog,
  deleteBlog as adminDeleteBlog,
  togglePublishBlog as adminToggleBlogPublish,
};
