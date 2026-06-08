import {
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import ConfirmModal from '../../../components/admin/ui/ConfirmModal';
import { Pagination, SearchBar } from '../../../components/shared';
import { useAdminBlogs, useDeleteBlog, useToggleBlogPublish } from '../../../hooks/useAdminBlogs';

const PAGE_SIZE = 10;

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Drafts', value: 'draft' },
];

const formatDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'A';

const getDeleteCopy = (blog) => ({
  title: 'Delete blog post',
  message: blog
    ? `Are you sure you want to delete "${blog.title}"? This action cannot be undone.`
    : 'Are you sure you want to delete this blog post? This action cannot be undone.',
  confirmLabel: 'Delete',
  danger: true,
});

function BlogSkeletonRows() {
  return Array.from({ length: 6 }).map((_, index) => (
    <tr key={`blog-skeleton-${index}`}>
      <td>
        <div className="flex items-center gap-3">
          <div className="h-14 w-20 bg-[#272B3F]">
            <div className="admin-skeleton h-full w-full" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="admin-skeleton h-4 w-3/4" />
            <div className="admin-skeleton h-3 w-1/2" />
          </div>
        </div>
      </td>
      <td><div className="admin-skeleton h-4 w-24" /></td>
      <td><div className="admin-skeleton h-5 w-20" /></td>
      <td><div className="admin-skeleton h-4 w-28" /></td>
      <td><div className="admin-skeleton h-4 w-24" /></td>
      <td>
        <div className="flex items-center gap-2">
          <div className="admin-skeleton h-8 w-8" />
          <div className="admin-skeleton h-8 w-8" />
          <div className="admin-skeleton h-8 w-8" />
        </div>
      </td>
    </tr>
  ));
}

function BlogEmptyState({ onCreate }) {
  return (
    <div className="admin-card flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center border border-[var(--admin-border)] bg-[#171A25]">
        <FileText size={30} className="text-[var(--admin-muted)]" />
      </div>
      <h3 className="text-2xl font-bold">No blogs yet. Create your first one!</h3>
      <p className="mt-3 max-w-lg text-sm leading-6" style={{ color: 'var(--admin-muted)' }}>
        Publish articles, updates, and guides for your portal audience. Start by drafting a blog post and assigning a category.
      </p>
      <button className="admin-button admin-button-primary mt-6" type="button" onClick={onCreate}>
        <Plus size={16} />
        New Blog
      </button>
    </div>
  );
}

export default function BlogListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteModal, setDeleteModal] = useState({ open: false, blog: null });

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const page = Math.max(Number(searchParams.get('page') || 1), 1);

  const filters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      status: status === 'all' ? undefined : status,
    }),
    [page, search, status],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminBlogs(filters);
  const deleteBlog = useDeleteBlog();
  const togglePublish = useToggleBlogPublish();

  const blogs = data?.data || [];
  const meta = data?.meta || {
    currentPage: page,
    totalPages: 1,
    totalCount: 0,
    limit: PAGE_SIZE,
  };

  const updateParams = (updater) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      updater(next);
      return next;
    }, { replace: true });
  };

  const handleSearchChange = (value) => {
    updateParams((next) => {
      if (value) next.set('search', value);
      else next.delete('search');
      next.set('page', '1');
    });
  };

  const handleStatusChange = (nextStatus) => {
    updateParams((next) => {
      if (nextStatus === 'all') next.delete('status');
      else next.set('status', nextStatus);
      next.set('page', '1');
    });
  };

  const handlePageChange = (nextPage) => {
    updateParams((next) => {
      next.set('page', String(nextPage));
    });
  };

  const openDeleteModal = (blog) => setDeleteModal({ open: true, blog });
  const closeDeleteModal = () => setDeleteModal({ open: false, blog: null });

  const confirmDelete = async () => {
    if (!deleteModal.blog) return;
    await deleteBlog.mutateAsync(deleteModal.blog.id);
    closeDeleteModal();
  };

  const handleTogglePublish = async (blog) => {
    await togglePublish.mutateAsync(blog.id);
  };

  const buttonBase =
    'inline-flex h-9 items-center justify-center border px-3 text-sm font-semibold transition-colors';

  return (
    <AdminLayout title="Blog Management" breadcrumb="Blogs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Blog Management</h2>
          <div className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
            {meta.totalCount || 0} total blogs
          </div>
        </div>

        <button className="admin-button admin-button-primary" type="button" onClick={() => navigate('/admin/blogs/new')}>
          <Plus size={16} />
          New Blog
        </button>
      </div>

      <div className="admin-card mb-4 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-center">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Search blogs, titles, authors..."
            isLoading={isFetching}
            inputClassName="!h-[38px] !border !border-[var(--admin-border)] !rounded-none !bg-[#161925] !px-3 !py-0 !pl-9 !pr-10 !text-[14px] !text-[var(--admin-text)] !outline-none focus:!border-[var(--admin-accent)]"
            iconClassName="!text-[var(--admin-muted)]"
            spinnerClassName="!text-[var(--admin-muted)]"
          />

          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => {
              const active = tab.value === status;
              return (
                <button
                  key={tab.value}
                  type="button"
                  className={`${buttonBase} ${active ? 'admin-button-primary' : ''}`}
                  style={active ? undefined : { background: '#171A25', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                  onClick={() => handleStatusChange(tab.value)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isError && (
        <div className="admin-card mb-4 p-6">
          <div className="text-lg font-semibold">Unable to load blogs</div>
          <div className="mt-2 text-sm" style={{ color: 'var(--admin-muted)' }}>
            {error?.response?.data?.message || error?.message || 'An unexpected error occurred.'}
          </div>
          <button className="admin-button admin-button-primary mt-4" type="button" onClick={() => refetch()}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {!isError && isLoading && !blogs.length && (
        <div className="admin-card overflow-hidden">
          <table className="w-full min-w-[1120px] border-collapse">
            <thead>
              <tr className="bg-[#191C2A] text-left text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--admin-muted)]">
                <th className="px-4 py-3">Blog</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <BlogSkeletonRows />
            </tbody>
          </table>
        </div>
      )}

      {!isError && !isLoading && blogs.length === 0 && (
        <BlogEmptyState onCreate={() => navigate('/admin/blogs/new')} />
      )}

      {!isError && blogs.length > 0 && (
        <div className="admin-card overflow-hidden">
          <table className="w-full min-w-[1120px] border-collapse">
            <thead>
              <tr className="bg-[#191C2A] text-left text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--admin-muted)]">
                <th className="px-4 py-3">Blog</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog.id} className="border-t border-[var(--admin-border)] hover:bg-[#24283A]">
                  <td className="px-4 py-4 align-middle">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden border border-[var(--admin-border)] bg-[#171A25]">
                        {blog.coverImage ? (
                          <img src={blog.coverImage} alt={blog.title} className="h-full w-full object-cover" />
                        ) : (
                          <FileText size={18} className="text-[var(--admin-muted)]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{blog.title}</div>
                        <div className="mt-1 max-h-10 overflow-hidden text-xs leading-5" style={{ color: 'var(--admin-muted)' }}>
                          {blog.excerpt || 'No excerpt available.'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle text-sm">{blog.category || '-'}</td>
                  <td className="px-4 py-4 align-middle">
                    <span className={`admin-badge ${blog.status === 'published' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                      {blog.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle text-sm">{formatDate(blog.publishedAt || blog.createdAt)}</td>
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center border border-[var(--admin-border)] bg-[#171A25] text-[10px] font-bold">
                        {blog.author?.avatar ? (
                          <img src={blog.author.avatar} alt={blog.author.name} className="h-full w-full object-cover" />
                        ) : (
                          getInitials(blog.author?.name)
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{blog.author?.name || 'Admin'}</div>
                        <div className="text-xs" style={{ color: 'var(--admin-muted)' }}>{blog.author?.id ? `ID: ${blog.author.id}` : 'Author'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                      <button
                        className="admin-button admin-icon-button"
                        type="button"
                        title="Edit"
                        aria-label={`Edit ${blog.title}`}
                        onClick={() => navigate(`/admin/blogs/${blog.id}/edit`)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="admin-button admin-icon-button"
                        type="button"
                        title={blog.status === 'published' ? 'Unpublish' : 'Publish'}
                        aria-label={`${blog.status === 'published' ? 'Unpublish' : 'Publish'} ${blog.title}`}
                        onClick={() => handleTogglePublish(blog)}
                        disabled={togglePublish.isPending}
                      >
                        {blog.status === 'published' ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        className="admin-button admin-icon-button"
                        type="button"
                        title="Delete"
                        aria-label={`Delete ${blog.title}`}
                        onClick={() => openDeleteModal(blog)}
                        disabled={deleteBlog.isPending}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isError && meta.totalPages > 1 && (
        <Pagination
          currentPage={meta.currentPage || page}
          totalPages={meta.totalPages}
          onPageChange={handlePageChange}
          className="mt-4 justify-end"
          buttonClassName="!h-9 !min-w-9 !border-[var(--admin-border)] !bg-[#171A25] !px-3 !text-[13px] !text-[var(--admin-text)] hover:!bg-[#24283A] hover:!border-[#3A405D]"
          activeButtonClassName="!border-[var(--admin-accent)] !bg-[var(--admin-accent)] !text-white hover:!border-[var(--admin-accent)] hover:!bg-[var(--admin-accent)]"
          ellipsisClassName="!text-[var(--admin-muted)]"
        />
      )}

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title={getDeleteCopy(deleteModal.blog).title}
        message={getDeleteCopy(deleteModal.blog).message}
        confirmLabel={getDeleteCopy(deleteModal.blog).confirmLabel}
        danger={getDeleteCopy(deleteModal.blog).danger}
        isLoading={deleteBlog.isPending}
      />
    </AdminLayout>
  );
}
