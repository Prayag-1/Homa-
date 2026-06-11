import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Calendar, Mail, MapPin, Phone, Search, Sparkles } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminTable from '../../components/admin/ui/AdminTable';
import AdminPagination from '../../components/admin/ui/AdminPagination';
import api from '../../services/api';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
};

const formatAddress = (address) => {
  if (!address?.line1) return '-';
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);
  return parts.join(', ');
};

const getTierStyle = (tier) => {
  switch (tier) {
    case 'Platinum':
      return 'admin-badge-success';
    case 'Gold':
      return 'admin-badge-warning';
    case 'Silver':
      return 'admin-badge';
    default:
      return 'admin-badge';
  }
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 20,
    role: 'user',
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => ({ ...current, search: searchInput, page: 1 }));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/admin/customers', { params: filters });
        const result = data?.data || {};
        const items = result.items || [];
        setCustomers(items);
        setPagination({
          page: result.page || filters.page,
          totalPages: result.totalPages || 1,
          total: result.total || 0,
        });
        if (!selectedCustomerId && items.length > 0) {
          setSelectedCustomerId(items[0].id);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [filters]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) || customers[0] || null,
    [customers, selectedCustomerId],
  );

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Customer',
      render: (_, row) => (
        <div>
          <div className="font-semibold">{row.name}</div>
          <div className="mt-1 text-xs" style={{ color: 'var(--admin-muted)' }}>
            {row.email || row.phone || row.phoneNumber || 'No contact set'}
          </div>
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      label: 'Phone',
      render: (_, row) => row.phone || row.phoneNumber || '-',
    },
    {
      key: 'membershipTier',
      label: 'Tier',
      render: (value) => (
        <span className={getTierStyle(value)}>
          {value || 'Bronze'}
        </span>
      ),
    },
    {
      key: 'loyaltyPoints',
      label: 'Points',
      render: (value) => <span className="font-semibold">{Number(value || 0)}</span>,
    },
    {
      key: 'birthday',
      label: 'Birthday',
      render: (value) => formatDate(value),
    },
    {
      key: 'address',
      label: 'Shipping Address',
      render: (value) => <span className="block max-w-[320px] truncate">{formatAddress(value)}</span>,
    },
    {
      key: 'isVerified',
      label: 'Verified',
      render: (value) => (
        <span className={`admin-badge ${value ? 'admin-badge-success' : 'admin-badge-warning'}`}>
          {value ? 'Verified' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (value) => formatDate(value),
    },
  ], []);

  const totalCustomers = customers.length;
  const totalPoints = customers.reduce((sum, customer) => sum + Number(customer.loyaltyPoints || 0), 0);

  return (
    <AdminLayout title="Customers" breadcrumb="Customers">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Customers</h2>
          <span className="admin-badge" style={{ background: '#24283A', borderColor: 'var(--admin-border)', color: 'var(--admin-muted)' }}>
            {totalCustomers} total
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--admin-muted)' }}>
          <Sparkles size={15} />
          {totalPoints} loyalty points in view
        </div>
      </div>

      <div className="admin-card mb-4 flex items-center gap-3 p-4">
        <Search size={16} style={{ color: 'var(--admin-muted)' }} />
        <input
          className="admin-input"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search name, email, or phone"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div>
          <AdminTable
            columns={columns}
            data={customers}
            loading={loading}
            emptyMessage="No customers found"
            onRowClick={(row) => setSelectedCustomerId(row.id)}
          />
          <AdminPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </div>

        <aside className="admin-card p-5">
          {selectedCustomer ? (
            <div className="space-y-5">
              <div>
                <div className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--admin-muted)' }}>
                  Selected customer
                </div>
                <h3 className="mt-2 text-2xl font-bold">{selectedCustomer.name}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
                  Customer details and membership summary
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail size={16} style={{ color: 'var(--admin-muted)', marginTop: 2 }} />
                  <div>
                    <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Email</div>
                    <div className="text-sm font-medium">{selectedCustomer.email || '-'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={16} style={{ color: 'var(--admin-muted)', marginTop: 2 }} />
                  <div>
                    <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Phone</div>
                    <div className="text-sm font-medium">{selectedCustomer.phone || selectedCustomer.phoneNumber || '-'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} style={{ color: 'var(--admin-muted)', marginTop: 2 }} />
                  <div>
                    <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Address</div>
                    <div className="text-sm font-medium leading-6">{formatAddress(selectedCustomer.address)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar size={16} style={{ color: 'var(--admin-muted)', marginTop: 2 }} />
                  <div>
                    <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Birthday</div>
                    <div className="text-sm font-medium">{formatDate(selectedCustomer.birthday)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--admin-border)', background: '#171A25' }}>
                  <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Membership</div>
                  <div className="mt-2 text-xl font-bold">{selectedCustomer.membershipTier || 'Bronze'}</div>
                </div>
                <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--admin-border)', background: '#171A25' }}>
                  <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Loyalty Points</div>
                  <div className="mt-2 text-xl font-bold">{Number(selectedCustomer.loyaltyPoints || 0)}</div>
                </div>
                <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--admin-border)', background: '#171A25' }}>
                  <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Verified</div>
                  <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold">
                    <BadgeCheck size={15} />
                    {selectedCustomer.isVerified ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--admin-border)', background: '#171A25' }}>
                  <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Joined</div>
                  <div className="mt-2 text-sm font-semibold">{formatDate(selectedCustomer.createdAt)}</div>
                </div>
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--admin-border)', background: '#171A25' }}>
                <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Membership rule</div>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--admin-muted)' }}>
                  Bronze up to 100 points, Silver up to 200, Gold up to 300, then Platinum.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center" style={{ color: 'var(--admin-muted)' }}>
              Select a customer to see membership details.
            </div>
          )}
        </aside>
      </div>
    </AdminLayout>
  );
}
