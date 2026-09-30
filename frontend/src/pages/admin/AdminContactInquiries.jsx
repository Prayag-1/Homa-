import { useEffect, useMemo, useState } from 'react';
import { Mail, MessageCircle, Search, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminTable from '../../components/admin/ui/AdminTable';
import ConfirmModal from '../../components/admin/ui/ConfirmModal';
import { useAdminContactInquiries, useDeleteContactInquiry, useUpdateContactInquiryStatus } from '../../hooks/useAdminContactInquiries';
import { useDebounce } from '../../hooks/useDebounce';

const PAGE_SIZE = 20;

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(value))
    : '-';

const statusColors = {
  new: 'admin-badge-warning',
  open: 'admin-badge',
  resolved: 'admin-badge-success',
};

export default function AdminContactInquiries() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 300);
  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: status !== 'all' ? status : undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [search, status, page],
  );

  const { data, isLoading, isError, error, refetch } = useAdminContactInquiries(filters);
  const updateStatus = useUpdateContactInquiryStatus();
  const deleteInquiry = useDeleteContactInquiry();

  useEffect(() => {
    setSearch(debouncedSearch.trim());
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const inquiries = data?.items || [];
  const pagination = {
    page: data?.page || page,
    totalPages: data?.totalPages || 1,
    total: data?.total || 0,
  };

  const columns = useMemo(
    () => [
      {
        key: 'subject',
        label: 'Subject',
        render: (value, row) => (
          <div>
            <div className="font-semibold">{value || 'No subject'}</div>
            <div className="mt-1 text-xs" style={{ color: 'var(--admin-muted)' }}>
              {row.name} • {row.email}
            </div>
          </div>
        ),
      },
      {
        key: 'message',
        label: 'Message',
        render: (value) => (
          <div className="max-w-[320px] truncate text-sm" style={{ color: 'var(--admin-muted)' }}>
            {value || '-'}
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: 120,
        render: (value) => (
          <span className={`admin-badge ${statusColors[value] || 'admin-badge-warning'}`}>
            {value?.charAt(0).toUpperCase() + value?.slice(1)}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Submitted',
        width: 150,
        render: formatDate,
      },
      {
        key: 'actions',
        label: 'Actions',
        width: 140,
        render: (_, row) => (
          <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
            <button
              className="admin-button admin-icon-button"
              type="button"
              title="Mark Open"
              onClick={() => updateStatus.mutate({ id: row.id, status: 'open' })}
              disabled={row.status === 'open' || row.status === 'resolved'}
            >
              <MessageCircle size={15} />
            </button>
            <button
              className="admin-button admin-icon-button"
              type="button"
              title="Mark Resolved"
              onClick={() => updateStatus.mutate({ id: row.id, status: 'resolved' })}
              disabled={row.status === 'resolved'}
            >
              <Mail size={15} />
            </button>
            <button
              className="admin-button admin-icon-button"
              type="button"
              title="Delete"
              onClick={() => setDeleteTarget(row)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ], [updateStatus],
  );

  return (
    <AdminLayout title="Contact Inquiries" breadcrumb="Contact Inquiries">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Contact Inquiries</h2>
          <div className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
            Review and manage messages submitted through the contact form.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="admin-button admin-button-primary"
            type="button"
            onClick={() => refetch()}
          >
            <Search size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-card mb-4 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-center">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
            <input
              className="admin-input pl-9"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by subject, name, or email..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'new', 'open', 'resolved'].map((option) => (
              <button
                key={option}
                type="button"
                className={`admin-button ${status === option ? 'admin-button-primary' : ''}`}
                style={status === option ? undefined : { background: '#171A25', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                onClick={() => setStatus(option)}
              >
                {option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isError && (
        <div className="admin-card mb-4 p-6">
          <div className="text-lg font-semibold">Unable to load inquiries</div>
          <div className="mt-2 text-sm" style={{ color: 'var(--admin-muted)' }}>
            {error?.response?.data?.message || error?.message || 'An unexpected error occurred.'}
          </div>
          <button className="admin-button admin-button-primary mt-4" type="button" onClick={() => refetch()}>
            Refresh
          </button>
        </div>
      )}

      <AdminTable
        columns={columns}
        data={inquiries}
        loading={isLoading}
        emptyMessage="No contact inquiries found"
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteInquiry.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="Delete inquiry"
        message={deleteTarget ? `Are you sure you want to delete the inquiry from ${deleteTarget.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        isLoading={deleteInquiry.isPending}
      />
    </AdminLayout>
  );
}
