import { Eye, UserCheck, Users, UserX, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPagination from '../../components/admin/ui/AdminPagination';
import AdminTable from '../../components/admin/ui/AdminTable';
import ConfirmModal from '../../components/admin/ui/ConfirmModal';
import Spinner from '../../components/ui/Spinner';
import {
  useAdminCustomer,
  useAdminCustomers,
  useToggleCustomerActive,
} from '../../hooks/useAdminCustomers';
import { useDebounce } from '../../hooks/useDebounce';
import { formatPrice } from '../../utils/formatPrice';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}) : '--');

const tierClass = {
  silver: 'border-gray-400/40 bg-gray-400/10 text-gray-200',
  gold: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200',
  platinum: 'border-purple-400/40 bg-purple-400/10 text-purple-200',
};

const statusClass = {
  pending: 'admin-badge-warning',
  processing: 'admin-badge',
  shipped: 'admin-badge',
  delivered: 'admin-badge-success',
  cancelled: 'admin-badge-error',
};

function TierBadge({ tier }) {
  const key = (tier || 'silver').toLowerCase();
  return (
    <span className={`inline-flex border px-2 py-1 text-xs font-bold uppercase ${tierClass[key] || tierClass.silver}`}>
      {tier || 'Silver'}
    </span>
  );
}

function CustomerDrawer({ customerId, onClose }) {
  const { data: customer, isLoading } = useAdminCustomer(customerId);
  const addresses = Array.isArray(customer?.address)
    ? customer.address
    : customer?.address
      ? [customer.address]
      : [];

  return (
    <AnimatePresence>
      {customerId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onMouseDown={onClose}>
          <motion.aside
            className="h-full w-full max-w-[520px] overflow-y-auto border-l p-5"
            style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">{customer?.name || 'Customer'}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
                  Customer profile
                </p>
              </div>
              <button className="admin-button admin-icon-button" type="button" onClick={onClose} aria-label="Close detail panel">
                <X size={16} />
              </button>
            </div>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner color="var(--admin-text)" />
              </div>
            ) : (
              <div className="space-y-5">
                <section className="border p-4" style={{ borderColor: 'var(--admin-border)' }}>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <span style={{ color: 'var(--admin-muted)' }}>Email</span>
                      <div className="mt-1 font-medium">{customer?.email || '--'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-muted)' }}>Phone</span>
                      <div className="mt-1 font-medium">{customer?.phone || '--'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-muted)' }}>Joined</span>
                      <div className="mt-1 font-medium">{formatDate(customer?.createdAt)}</div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-3">
                  <div className="border p-4" style={{ borderColor: 'var(--admin-border)' }}>
                    <div className="text-xs uppercase" style={{ color: 'var(--admin-muted)' }}>Membership</div>
                    <div className="mt-3"><TierBadge tier={customer?.membershipTier} /></div>
                  </div>
                  <div className="border p-4" style={{ borderColor: 'var(--admin-border)' }}>
                    <div className="text-xs uppercase" style={{ color: 'var(--admin-muted)' }}>Loyalty Points</div>
                    <div className="mt-2 text-2xl font-black">{Number(customer?.loyaltyPoints || 0).toLocaleString()}</div>
                  </div>
                  <div className="border p-4" style={{ borderColor: 'var(--admin-border)' }}>
                    <div className="text-xs uppercase" style={{ color: 'var(--admin-muted)' }}>Lifetime Orders</div>
                    <div className="mt-2 text-2xl font-black">{customer?.stats?.totalOrders || 0}</div>
                  </div>
                  <div className="border p-4" style={{ borderColor: 'var(--admin-border)' }}>
                    <div className="text-xs uppercase" style={{ color: 'var(--admin-muted)' }}>Total Spent</div>
                    <div className="mt-2 text-xl font-black">{formatPrice(customer?.stats?.totalSpent)}</div>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 font-bold">Addresses</h4>
                  {addresses.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>No saved addresses.</p>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map((address, index) => (
                        <div key={index} className="border p-3 text-sm" style={{ borderColor: 'var(--admin-border)' }}>
                          {typeof address === 'string'
                            ? address
                            : [address.street, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ') || JSON.stringify(address)}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h4 className="mb-3 font-bold">Recent Orders</h4>
                  <div className="space-y-2">
                    {(customer?.orders || []).length === 0 && (
                      <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>No recent orders.</p>
                    )}
                    {(customer?.orders || []).map((order) => (
                      <div key={order._id} className="border p-3" style={{ borderColor: 'var(--admin-border)' }}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold">{formatPrice(order.grandTotal)}</div>
                            <div className="mt-1 text-xs" style={{ color: 'var(--admin-muted)' }}>
                              {formatDate(order.createdAt)} - {order.paymentMethod || '--'}
                            </div>
                          </div>
                          <span className={`admin-badge ${statusClass[order.orderStatus] || ''}`}>
                            {order.orderStatus || 'unknown'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function AdminCustomers() {
  const [filters, setFilters] = useState({
    search: '',
    membershipTier: '',
    isActive: 'all',
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [confirmCustomer, setConfirmCustomer] = useState(null);
  const { data, isLoading } = useAdminCustomers(filters);
  const toggleCustomer = useToggleCustomerActive();
  const customers = data?.customers || [];
  const pagination = data?.pagination || {};

  useEffect(() => {
    setFilters((current) => ({ ...current, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <button className="font-bold hover:text-[var(--admin-accent)]" type="button" onClick={() => setSelectedCustomerId(row._id)}>
          {value}
        </button>
      ),
    },
    { key: 'membershipTier', label: 'Tier', render: (value) => <TierBadge tier={value} /> },
    { key: 'loyaltyPoints', label: 'Loyalty Points', render: (value) => Number(value || 0).toLocaleString() },
    {
      key: 'orderCount',
      label: 'Orders Count',
      render: (value) => value > 0
        ? Number(value).toLocaleString()
        : <span className="font-semibold text-orange-300">Never purchased</span>,
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      render: (value) => Number(value || 0) > 0 ? formatPrice(value) : '--',
    },
    { key: 'createdAt', label: 'Joined Date', render: formatDate },
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
      key: 'actions',
      label: 'Actions',
      width: 120,
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
          <button className="admin-button admin-icon-button" type="button" title="View" onClick={() => setSelectedCustomerId(row._id)}>
            <Eye size={15} />
          </button>
          <button
            className="admin-button admin-icon-button"
            type="button"
            title={row.isActive ? 'Deactivate' : 'Activate'}
            onClick={() => setConfirmCustomer(row)}
          >
            {row.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <AdminLayout title="Customers" breadcrumb="Customers">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Customers</h2>
          <span className="admin-badge" style={{ background: '#24283A', borderColor: 'var(--admin-border)', color: 'var(--admin-muted)' }}>
            <Users size={13} />
            {pagination.total || 0} total
          </span>
        </div>
      </div>

      <div className="admin-card mb-4 grid grid-cols-1 gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_180px_160px]">
        <input
          className="admin-input"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search customer names"
        />
        <select className="admin-select" value={filters.membershipTier} onChange={(event) => updateFilter('membershipTier', event.target.value)}>
          <option value="">All tiers</option>
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
          <option value="Platinum">Platinum</option>
        </select>
        <select className="admin-select" value={filters.isActive} onChange={(event) => updateFilter('isActive', event.target.value)}>
          <option value="all">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        data={customers}
        loading={isLoading}
        emptyMessage="No customers match the current filters"
        onRowClick={(row) => setSelectedCustomerId(row._id)}
      />
      <AdminPagination
        page={filters.page}
        totalPages={pagination.pages || 1}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
      />

      <CustomerDrawer customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />

      <ConfirmModal
        isOpen={Boolean(confirmCustomer)}
        onClose={() => setConfirmCustomer(null)}
        onConfirm={async () => {
          await toggleCustomer.mutateAsync(confirmCustomer._id);
          setConfirmCustomer(null);
        }}
        title={`${confirmCustomer?.isActive ? 'Deactivate' : 'Activate'} customer`}
        message={
          confirmCustomer
            ? `${confirmCustomer.name} will be marked as ${confirmCustomer.isActive ? 'inactive' : 'active'}.`
            : ''
        }
        confirmLabel={confirmCustomer?.isActive ? 'Deactivate' : 'Activate'}
        danger={confirmCustomer?.isActive}
        isLoading={toggleCustomer.isPending}
      />
    </AdminLayout>
  );
}
