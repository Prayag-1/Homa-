import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Pencil, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import AdminLayout from './AdminLayout';
import AdminTable from './ui/AdminTable';
import ConfirmModal from './ui/ConfirmModal';
import InlineModal from './ui/InlineModal';
import SortOrderInput from './ui/SortOrderInput';
import Spinner from '../ui/Spinner';

const taxonomySchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100, 'Name must be 100 characters or fewer.'),
  description: z.string().trim().max(500, 'Description must be 500 characters or fewer.').optional(),
  sortOrder: z.preprocess(
    (value) => (value === '' || value === null ? undefined : Number(value)),
    z.number().int().min(0, 'Sort order cannot be negative.').max(9999, 'Sort order must be 9999 or less.').optional(),
  ),
});

const defaultValues = {
  name: '',
  description: '',
  sortOrder: 0,
};

const truncate = (value = '', length = 60) => {
  if (!value) return '-';
  return value.length > length ? `${value.slice(0, length)}...` : value;
};

export default function AdminTaxonomyManager({
  title,
  entityLabel,
  useData,
  mutations,
  deactivateMessage,
}) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);
  const [formError, setFormError] = useState('');

  const { data: items = [], isLoading } = useData({ search });
  const createItem = mutations.useCreate();
  const updateItem = mutations.useUpdate(editingItem?._id);
  const toggleItem = mutations.useToggle();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues,
    resolver: zodResolver(taxonomySchema),
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!modalOpen) return;
    reset(editingItem ? {
      name: editingItem.name || '',
      description: editingItem.description || '',
      sortOrder: editingItem.sortOrder ?? 0,
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
    toggleItem.mutate(item._id);
  };

  const onSubmit = (data) => {
    setFormError('');
    const mutation = editingItem ? updateItem : createItem;
    mutation.mutate(data, {
      onSuccess: closeModal,
      onError: (err) => setFormError(err.response?.data?.message || `Failed to save ${entityLabel.toLowerCase()}`),
    });
  };

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      render: (_, row) => (
        <div>
          <div className="font-semibold">{row.name}</div>
          <div className="mt-1 font-mono text-xs" style={{ color: 'var(--admin-muted)' }}>
            {row.slug || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => <span style={{ color: 'var(--admin-muted)' }}>{truncate(value)}</span>,
    },
    {
      key: 'sortOrder',
      label: 'Sort Order',
      width: 120,
      render: (value) => <div className="text-center">{value ?? 0}</div>,
    },
    {
      key: 'isActive',
      label: 'Status',
      width: 110,
      render: (value) => (
        <span className={`admin-badge ${value ? 'admin-badge-success' : 'admin-badge-error'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'productsCount',
      label: 'Products Count',
      width: 150,
      render: () => <span style={{ color: 'var(--admin-muted)' }}>-</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 120,
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
          <button className="admin-button admin-icon-button" type="button" title="Edit" onClick={() => openEditModal(row)}>
            <Pencil size={15} />
          </button>
          <button
            className="admin-button admin-icon-button"
            type="button"
            title={row.isActive ? 'Deactivate' : 'Activate'}
            onClick={() => handleToggle(row)}
          >
            {row.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      ),
    },
  ], [entityLabel, toggleItem]);

  const formSubmitting = createItem.isPending || updateItem.isPending;

  return (
    <AdminLayout title={title} breadcrumb={title}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{title}</h2>
          <span className="admin-badge" style={{ background: '#24283A', borderColor: 'var(--admin-border)', color: 'var(--admin-muted)' }}>
            {items.length} total
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="admin-input w-[260px]"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={`Search ${title.toLowerCase()}`}
          />
          <button className="admin-button admin-button-primary" type="button" onClick={openCreateModal}>
            <Plus size={16} />
            Add {entityLabel}
          </button>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={items}
        loading={isLoading}
        emptyMessage={`No ${title.toLowerCase()} found`}
      />

      <ConfirmModal
        isOpen={Boolean(confirmItem)}
        onClose={() => setConfirmItem(null)}
        onConfirm={async () => {
          if (!confirmItem) return;
          await toggleItem.mutateAsync(confirmItem._id);
          setConfirmItem(null);
        }}
        title={`Deactivate ${entityLabel.toLowerCase()}`}
        message={confirmItem ? deactivateMessage(confirmItem.name) : ''}
        confirmLabel="Deactivate"
        danger
        isLoading={toggleItem.isPending}
      />

      <InlineModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingItem ? `Edit ${entityLabel}` : `Add ${entityLabel}`}
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="admin-field-label" htmlFor="taxonomy-name">Name*</label>
            <input id="taxonomy-name" className="admin-input" {...register('name')} />
            {errors.name && <p className="admin-field-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="admin-field-label" htmlFor="taxonomy-description">Description</label>
            <textarea
              id="taxonomy-description"
              className="admin-textarea"
              maxLength={500}
              {...register('description')}
            />
            {errors.description && <p className="admin-field-error">{errors.description.message}</p>}
          </div>
          <Controller
            name="sortOrder"
            control={control}
            render={({ field }) => (
              <SortOrderInput
                value={field.value}
                onChange={field.onChange}
                error={errors.sortOrder?.message}
              />
            )}
          />
          {formError && <p className="admin-field-error">{formError}</p>}
          <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--admin-border)' }}>
            <button className="admin-button" type="button" onClick={closeModal} disabled={formSubmitting}>
              Cancel
            </button>
            <button className="admin-button admin-button-primary" type="submit" disabled={formSubmitting}>
              {formSubmitting && <Spinner size="sm" color="currentColor" />}
              {editingItem ? 'Save Changes' : `Create ${entityLabel}`}
            </button>
          </div>
        </form>
      </InlineModal>
    </AdminLayout>
  );
}
