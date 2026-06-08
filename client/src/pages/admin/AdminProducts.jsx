import {
  Archive,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPagination from '../../components/admin/ui/AdminPagination';
import AdminTable from '../../components/admin/ui/AdminTable';
import ConfirmModal from '../../components/admin/ui/ConfirmModal';
import {
  useAdminProducts,
  useToggleActive,
  useToggleFeatured,
  useUpdateStock,
} from '../../hooks/useAdminProducts';
import { usePublicCategories } from '../../hooks/useAdminBrandsCategories';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const stockColor = (stock) => {
  if (stock < 5) return 'var(--admin-error)';
  if (stock < 20) return 'var(--admin-warning)';
  return 'var(--admin-text)';
};

const getModalCopy = (modal) => {
  const product = modal.product;
  if (!product) return { title: '', message: '', confirmLabel: 'Confirm', danger: false };

  if (modal.action === 'toggle-active') {
    const nextActive = !product.isActive;
    return {
      title: `${nextActive ? 'Activate' : 'Deactivate'} product`,
      message: nextActive
        ? `Are you sure you want to activate ${product.name}? It will become visible to customers.`
        : `Are you sure you want to deactivate ${product.name}? It will no longer be visible to customers.`,
      confirmLabel: nextActive ? 'Activate' : 'Deactivate',
      danger: !nextActive,
    };
  }

  if (modal.action === 'best-seller') {
    return {
      title: `${product.isBestSeller ? 'Remove' : 'Mark'} best seller`,
      message: `${product.name} will ${product.isBestSeller ? 'no longer be' : 'be'} marked as a best seller.`,
      confirmLabel: 'Confirm',
      danger: false,
    };
  }

  return { title: '', message: '', confirmLabel: 'Confirm', danger: false };
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    isActive: 'all',
    isNewArrival: '',
    isBestSeller: '',
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    product: null,
    action: null,
  });
  const [stockModal, setStockModal] = useState({
    open: false,
    product: null,
    stock: 0,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => ({ ...current, search: searchInput, page: 1 }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useAdminProducts(filters);
  const { data: categories = [], isLoading: categoriesLoading } = usePublicCategories();
  const toggleActive = useToggleActive();
  const toggleFeatured = useToggleFeatured();
  const updateStock = useUpdateStock();
  const products = data?.items || [];
  const modalCopy = getModalCopy(confirmModal);
  const activeCategories = useMemo(
    () => categories
      .filter((category) => category.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)),
    [categories],
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      category: '',
      isActive: 'all',
      isNewArrival: '',
      isBestSeller: '',
      page: 1,
      limit: 20,
    });
  };

  const handleConfirm = async () => {
    if (!confirmModal.product) return;

    if (confirmModal.action === 'toggle-active') {
      await toggleActive.mutateAsync(confirmModal.product._id);
    }

    if (confirmModal.action === 'best-seller') {
      await toggleFeatured.mutateAsync({ id: confirmModal.product._id, field: 'isBestSeller' });
    }

    setConfirmModal({ open: false, product: null, action: null });
  };

  const saveStock = async () => {
    if (!stockModal.product) return;
    await updateStock.mutateAsync({
      id: stockModal.product._id,
      stock: Number(stockModal.stock),
    });
    setStockModal({ open: false, product: null, stock: 0 });
  };

  const columns = useMemo(() => [
    {
      key: 'thumbnail',
      label: '',
      width: 64,
      render: (_, row) => (
        <div className="h-10 w-10 border bg-[#171A25]" style={{ borderColor: 'var(--admin-border)' }}>
          {row.images?.[0]?.url && (
            <img
              src={row.images[0].url}
              alt={row.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Product',
      render: (_, row) => (
        <div>
          <div className="font-semibold">{row.name}</div>
          <div className="mt-1 text-xs" style={{ color: 'var(--admin-muted)' }}>{row.brand}</div>
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (value) => <span className="font-mono text-xs" style={{ color: 'var(--admin-muted)' }}>{value}</span>,
    },
    { key: 'category', label: 'Category' },
    {
      key: 'price',
      label: 'Price',
      render: (value, row) => (
        <div>
          <div>{formatCurrency(value)}</div>
          {row.comparePrice && (
            <div className="mt-1 text-xs line-through" style={{ color: 'var(--admin-muted)' }}>
              {formatCurrency(row.comparePrice)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (value) => <span className="font-bold" style={{ color: stockColor(value) }}>{value}</span>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span className={`admin-badge ${value ? 'admin-badge-success' : 'admin-badge-error'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'isNewArrival',
      label: 'New',
      render: (value) => value ? <span className="admin-badge admin-badge-warning"><Sparkles size={12} /> New</span> : null,
    },
    {
      key: 'isBestSeller',
      label: 'Best',
      render: (value) => value ? <span className="admin-badge admin-badge-warning"><Star size={12} /> Best</span> : null,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 210,
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
          <button className="admin-button admin-icon-button" type="button" title="Edit" onClick={() => navigate(`/admin/products/${row._id}/edit`)}>
            <Pencil size={15} />
          </button>
          <button className="admin-button admin-icon-button" type="button" title="Stock" onClick={() => setStockModal({ open: true, product: row, stock: row.stock })}>
            <Archive size={15} />
          </button>
          <button className="admin-button admin-icon-button" type="button" title="Best seller" onClick={() => setConfirmModal({ open: true, product: row, action: 'best-seller' })}>
            <Star size={15} />
          </button>
          <button className="admin-button admin-icon-button" type="button" title="New arrival" onClick={() => toggleFeatured.mutate({ id: row._id, field: 'isNewArrival' })}>
            <Sparkles size={15} />
          </button>
          <button className="admin-button admin-icon-button" type="button" title={row.isActive ? 'Deactivate' : 'Activate'} onClick={() => setConfirmModal({ open: true, product: row, action: 'toggle-active' })}>
            {row.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      ),
    },
  ], [navigate, toggleFeatured]);

  return (
    <AdminLayout title="Products" breadcrumb="Products">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Products</h2>
          <span className="admin-badge" style={{ background: '#24283A', borderColor: 'var(--admin-border)', color: 'var(--admin-muted)' }}>
            {data?.total || 0} total
          </span>
        </div>
        <button className="admin-button admin-button-primary" type="button" onClick={() => navigate('/admin/products/new')}>
          <Plus size={16} />
          Add Product
        </button>
      </div>

      <div className="admin-card mb-4 grid grid-cols-1 gap-3 p-4 lg:grid-cols-[minmax(220px,1fr)_180px_150px_auto_auto_auto]">
        <input
          className="admin-input"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search products, brand, SKU"
        />
        <select className="admin-select" value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
          <option value="">{categoriesLoading ? 'Loading categories...' : 'All categories'}</option>
          {activeCategories.map((category) => (
            <option key={category._id || category.slug || category.name} value={category.name}>{category.name}</option>
          ))}
        </select>
        <select className="admin-select" value={filters.isActive} onChange={(event) => updateFilter('isActive', event.target.value)}>
          <option value="all">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <label className="flex h-[38px] items-center gap-2 text-sm" style={{ color: 'var(--admin-muted)' }}>
          <input
            type="checkbox"
            checked={filters.isNewArrival === 'true'}
            onChange={(event) => updateFilter('isNewArrival', event.target.checked ? 'true' : '')}
          />
          New Arrivals
        </label>
        <label className="flex h-[38px] items-center gap-2 text-sm" style={{ color: 'var(--admin-muted)' }}>
          <input
            type="checkbox"
            checked={filters.isBestSeller === 'true'}
            onChange={(event) => updateFilter('isBestSeller', event.target.checked ? 'true' : '')}
          />
          Best Sellers
        </label>
        <button className="admin-link-button h-[38px] text-left" type="button" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      <AdminTable
        columns={columns}
        data={products}
        loading={isLoading}
        emptyMessage="No products match the current filters"
      />
      <AdminPagination
        page={filters.page}
        totalPages={data?.totalPages || 1}
        onPageChange={(newPage) => setFilters((current) => ({ ...current, page: newPage }))}
      />

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, product: null, action: null })}
        onConfirm={handleConfirm}
        title={modalCopy.title}
        message={modalCopy.message}
        confirmLabel={modalCopy.confirmLabel}
        danger={modalCopy.danger}
        isLoading={toggleActive.isPending || toggleFeatured.isPending}
      />

      {stockModal.open && (
        <div className="admin-modal-overlay" onMouseDown={() => setStockModal({ open: false, product: null, stock: 0 })}>
          <div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="border-b p-5" style={{ borderColor: 'var(--admin-border)' }}>
              <h2 className="text-lg font-bold">Update Stock for {stockModal.product?.name}</h2>
            </div>
            <div className="p-5">
              <input
                className="admin-input"
                type="number"
                min="0"
                value={stockModal.stock}
                onChange={(event) => setStockModal((current) => ({ ...current, stock: event.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 border-t p-4" style={{ borderColor: 'var(--admin-border)' }}>
              <button className="admin-button" type="button" onClick={() => setStockModal({ open: false, product: null, stock: 0 })}>
                Cancel
              </button>
              <button className="admin-button admin-button-primary" type="button" onClick={saveStock} disabled={updateStock.isPending}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
