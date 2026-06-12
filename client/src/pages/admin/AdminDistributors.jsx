import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MapPin, Pencil, Phone, Plus, RefreshCw, Search, Trash2, User, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminTable from '../../components/admin/ui/AdminTable';
import ConfirmModal from '../../components/admin/ui/ConfirmModal';
import InlineModal from '../../components/admin/ui/InlineModal';
import { AddressMapPicker } from '../../components/shared';
import Spinner from '../../components/ui/Spinner';
import {
  useAdminDistributors,
  useCreateDistributor,
  useDeleteDistributor,
  useToggleDistributorActive,
  useUpdateDistributor,
} from '../../hooks/useDistributor';
import { useDebounce } from '../../hooks/useDebounce';

const statusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be 120 characters or fewer'),
  address: z.string().trim().max(255, 'Address must be 255 characters or fewer').optional().or(z.literal('')),
  phone: z.string().trim().max(50, 'Phone must be 50 characters or fewer').optional().or(z.literal('')),
  email: z.string().trim().email('Enter a valid email address').max(120, 'Email must be 120 characters or fewer').optional().or(z.literal('')),
  coverageArea: z.string().trim().max(160, 'Coverage area must be 160 characters or fewer').optional().or(z.literal('')),
  representative: z.string().trim().max(120, 'Representative must be 120 characters or fewer').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

const defaultValues = {
  name: '',
  address: '',
  phone: '',
  email: '',
  coverageArea: '',
  representative: '',
  isActive: true,
};

const normalize = (value = '') => value.trim();

function FieldError({ error }) {
  if (!error) return null;
  return <p className="admin-field-error">{error.message}</p>;
}

function DistributorStatusBadge({ isActive }) {
  return (
    <span className={`admin-badge ${isActive ? 'admin-badge-success' : 'admin-badge-warning'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function AdminDistributors() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [status, setStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [formError, setFormError] = useState('');

  const { data: distributors = [], isLoading, isError, error, refetch } = useAdminDistributors({
    search,
    status,
  });

  const createDistributor = useCreateDistributor();
  const updateDistributor = useUpdateDistributor(editingItem?.id || '');
  const toggleDistributor = useToggleDistributorActive();
  const deleteDistributor = useDeleteDistributor();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onTouched',
  });

  const addressValue = watch('address');

  useEffect(() => {
    setSearch(debouncedSearch.trim());
  }, [debouncedSearch]);

  useEffect(() => {
    if (!modalOpen) return;

    reset(editingItem ? {
      name: editingItem.name || '',
      address: editingItem.address || '',
      phone: editingItem.phone || '',
      email: editingItem.email || '',
      coverageArea: editingItem.coverageArea || '',
      representative: editingItem.representative || '',
      isActive: Boolean(editingItem.isActive),
    } : defaultValues);
    setFormError('');
  }, [editingItem, modalOpen, reset]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormError('');
    reset(defaultValues);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleToggle = (item) => {
    if (item.isActive) {
      setConfirmItem(item);
      return;
    }

    toggleDistributor.mutate(item.id);
  };

  const openDeleteModal = (item) => {
    setDeleteItem(item);
  };

  const onSubmit = async (values) => {
    const payload = {
      name: normalize(values.name),
      address: normalize(values.address),
      phone: normalize(values.phone),
      email: normalize(values.email),
      coverageArea: normalize(values.coverageArea),
      representative: normalize(values.representative),
      isActive: Boolean(values.isActive),
    };

    setFormError('');

    try {
      if (editingItem) {
        await updateDistributor.mutateAsync(payload);
      } else {
        await createDistributor.mutateAsync(payload);
      }

      closeModal();
    } catch (submitError) {
      setFormError(submitError.response?.data?.message || 'Failed to save distributor');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    await deleteDistributor.mutateAsync(deleteItem.id);
    setDeleteItem(null);
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Distributor',
        render: (_, row) => (
          <div>
            <div className="font-semibold">{row.name}</div>
            <div className="mt-1 flex items-start gap-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
              <MapPin size={13} className="mt-0.5 shrink-0" />
              <span className="max-w-[260px] truncate">{row.address || row.coverageArea || '-'}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'coverageArea',
        label: 'Coverage Area',
        width: 190,
        render: (value) => <span style={{ color: 'var(--admin-muted)' }}>{value || '-'}</span>,
      },
      {
        key: 'contact',
        label: 'Contact',
        width: 220,
        render: (_, row) => (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Phone size={13} className="text-[var(--admin-muted)]" />
              <span>{row.phone || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={13} className="text-[var(--admin-muted)]" />
              <span className="truncate">{row.email || '-'}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'representative',
        label: 'Representative',
        width: 170,
        render: (value) => <span>{value || '-'}</span>,
      },
      {
        key: 'isActive',
        label: 'Status',
        width: 110,
        render: (value) => <DistributorStatusBadge isActive={value} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        width: 120,
        render: (_, row) => (
          <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
            <button
              className="admin-button admin-icon-button"
              type="button"
              title="Edit"
              aria-label={`Edit ${row.name}`}
              onClick={() => openEditModal(row)}
            >
              <Pencil size={15} />
            </button>
            <button
              className="admin-button admin-icon-button"
              type="button"
              title={row.isActive ? 'Deactivate' : 'Activate'}
              aria-label={`${row.isActive ? 'Deactivate' : 'Activate'} ${row.name}`}
              onClick={() => handleToggle(row)}
              disabled={toggleDistributor.isPending}
            >
              {row.isActive ? <X size={15} /> : <User size={15} />}
            </button>
            <button
              className="admin-button admin-icon-button"
              type="button"
              title="Delete"
              aria-label={`Delete ${row.name}`}
              onClick={() => openDeleteModal(row)}
              disabled={deleteDistributor.isPending}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [deleteDistributor.isPending, toggleDistributor.isPending],
  );

  const currentMutationPending = createDistributor.isPending || updateDistributor.isPending;

  return (
    <AdminLayout title="Distributors" breadcrumb="Distributors">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Authorized Dealers</h2>
          <div className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
            Manage the authorized distributor network shown to customers.
          </div>
        </div>

        <button className="admin-button admin-button-primary" type="button" onClick={openCreateModal}>
          <Plus size={16} />
          Add Distributor
        </button>
      </div>

      <div className="admin-card mb-4 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-center">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
            <input
              className="admin-input pl-9"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search dealers, coverage areas, or contacts..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => {
              const active = tab.value === status;
              return (
                <button
                  key={tab.value}
                  type="button"
                  className={`admin-button ${active ? 'admin-button-primary' : ''}`}
                  style={active ? undefined : { background: '#171A25', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                  onClick={() => setStatus(tab.value)}
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
          <div className="text-lg font-semibold">Unable to load distributors</div>
          <div className="mt-2 text-sm" style={{ color: 'var(--admin-muted)' }}>
            {error?.response?.data?.message || error?.message || 'An unexpected error occurred.'}
          </div>
          <button className="admin-button admin-button-primary mt-4" type="button" onClick={() => refetch()}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      <AdminTable
        columns={columns}
        data={distributors}
        loading={isLoading}
        onRowClick={openEditModal}
        emptyMessage="No distributors found"
      />

      <InlineModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Distributor' : 'Add Distributor'}
        width="960px"
      >
        <form className="max-w-full space-y-5 overflow-x-hidden" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-field-label" htmlFor="distributor-name">Name*</label>
              <input id="distributor-name" className="admin-input" {...register('name')} />
              <FieldError error={errors.name} />
            </div>

            <div>
              <label className="admin-field-label" htmlFor="distributor-representative">Representative</label>
              <input id="distributor-representative" className="admin-input" {...register('representative')} />
              <FieldError error={errors.representative} />
            </div>
          </div>

          <div>
            <label className="admin-field-label" htmlFor="distributor-address">Address</label>
            <textarea id="distributor-address" className="admin-textarea" maxLength={255} {...register('address')} />
            <FieldError error={errors.address} />
          </div>

          <AddressMapPicker
            address={addressValue}
            title="Distributor location"
            description="Use Leaflet to preview and refine the distributor address."
            editable
            variant="dark"
            onAddressSelect={(value) => setValue('address', value, { shouldDirty: true, shouldValidate: true })}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-field-label" htmlFor="distributor-phone">Phone</label>
              <input id="distributor-phone" className="admin-input" {...register('phone')} />
              <FieldError error={errors.phone} />
            </div>

            <div>
              <label className="admin-field-label" htmlFor="distributor-email">Email</label>
              <input id="distributor-email" className="admin-input" type="email" {...register('email')} />
              <FieldError error={errors.email} />
            </div>
          </div>

          <div>
            <label className="admin-field-label" htmlFor="distributor-coverage">Coverage Area</label>
            <input id="distributor-coverage" className="admin-input" {...register('coverageArea')} />
            <FieldError error={errors.coverageArea} />
          </div>

          <label className="admin-list-row">
            <input className="h-4 w-4" type="checkbox" {...register('isActive')} />
            <div className="min-w-0">
              <div className="text-sm font-semibold">Active</div>
              <div className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                Only active distributors are visible to customers.
              </div>
            </div>
          </label>

          {formError && <p className="admin-field-error">{formError}</p>}

          <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--admin-border)' }}>
            <button className="admin-button" type="button" onClick={closeModal} disabled={currentMutationPending}>
              Cancel
            </button>
            <button className="admin-button admin-button-primary" type="submit" disabled={currentMutationPending || !isDirty}>
              {currentMutationPending && <Spinner size="sm" color="currentColor" />}
              {editingItem ? 'Save Changes' : 'Create Distributor'}
            </button>
          </div>
        </form>
      </InlineModal>

      <ConfirmModal
        isOpen={Boolean(confirmItem)}
        onClose={() => setConfirmItem(null)}
        onConfirm={async () => {
          if (!confirmItem) return;
          await toggleDistributor.mutateAsync(confirmItem.id);
          setConfirmItem(null);
        }}
        title={`Deactivate ${confirmItem?.name || 'distributor'}`}
        message={confirmItem ? `This will hide ${confirmItem.name} from the public dealer list.` : ''}
        confirmLabel="Deactivate"
        danger
        isLoading={toggleDistributor.isPending}
      />

      <ConfirmModal
        isOpen={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteItem?.name || 'distributor'}`}
        message={deleteItem ? `Are you sure you want to delete ${deleteItem.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        isLoading={deleteDistributor.isPending}
      />
    </AdminLayout>
  );
}
