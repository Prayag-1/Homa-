import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminTable from '../../components/admin/ui/AdminTable';
import AdminPagination from '../../components/admin/ui/AdminPagination';
import Spinner from '../../components/ui/Spinner';
import { formatPrice } from '../../utils/formatPrice';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  processing: { bg: '#EDE9FE', text: '#6D28D9' },
  shipped: { bg: '#CFFAFE', text: '#0E7490' },
  delivered: { bg: '#DCFCE7', text: '#166534' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
};

const PAYMENT_COLORS = {
  esewa: { bg: 'rgba(110, 194, 7, 0.15)', text: '#86EFAC' },
  fonepay: { bg: 'rgba(37, 99, 235, 0.15)', text: '#93C5FD' },
  cod: { bg: 'rgba(245, 158, 11, 0.15)', text: '#FCD34D' },
};

const paymentLabels = {
  esewa: 'eSewa',
  fonepay: 'Fonepay',
  cod: 'COD',
};

const useAdminOrders = (filters) =>
  useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: () => api.get('/admin/orders', { params: filters }).then((res) => res.data.data),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });

const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) =>
      api.put(`/admin/orders/${id}/status`, { status }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });
};

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#374151' };

  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        padding: '2px 10px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontFamily: 'var(--font-body)',
      }}
    >
      {status || 'unknown'}
    </span>
  );
}

function PaymentBadge({ method }) {
  const colors = PAYMENT_COLORS[method] || { bg: '#24283A', text: 'var(--admin-muted)' };

  return (
    <span
      className="inline-flex px-2 py-1 text-xs font-bold uppercase"
      style={{ background: colors.bg, color: colors.text }}
    >
      {paymentLabels[method] || method || 'Unknown'}
    </span>
  );
}

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-NP') : '--');

const formatAddress = (address) => {
  if (!address) return '--';
  return [address.street, address.city, address.phone].filter(Boolean).join(', ') || '--';
};

function OrderStatusSelect({ value, onChange, disabled = false }) {
  return (
    <select
      value={value || 'pending'}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      style={{
        background: '#1F2232',
        color: '#F9FAFB',
        border: '1px solid #2D3148',
        padding: '4px 8px',
        fontSize: '12px',
      }}
    >
      {ORDER_STATUSES.map((status) => (
        <option key={status} value={status}>{status}</option>
      ))}
    </select>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span style={{ color: 'var(--admin-muted)' }}>{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function OrderDetailPanel({ order, onClose, updateStatus }) {
  const [status, setStatus] = useState(order?.orderStatus || 'pending');
  if (!order) return null;

  const saveStatus = async () => {
    await updateStatus.mutateAsync({ id: order._id, status });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onMouseDown={onClose}>
        <motion.aside
          className="h-full w-full max-w-[480px] overflow-y-auto border-l p-5"
          style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">Order #{order._id?.slice(-8)}</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
                {formatDate(order.createdAt)}
              </p>
            </div>
            <button className="admin-button admin-icon-button" type="button" onClick={onClose} aria-label="Close order details">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-6">
            <section className="space-y-3 border p-4" style={{ borderColor: 'var(--admin-border)' }}>
              <h4 className="font-bold">Customer Info</h4>
              <DetailRow label="Name" value={order.user?.name || 'Guest'} />
              {order.user?.email && <DetailRow label="Email" value={order.user.email} />}
              <DetailRow label="Phone" value={order.user?.phone || order.shippingAddress?.phone || '--'} />
              <DetailRow label="Shipping" value={formatAddress(order.shippingAddress)} />
            </section>

            <section className="border p-4" style={{ borderColor: 'var(--admin-border)' }}>
              <h4 className="mb-3 font-bold">Order Items</h4>
              <div className="space-y-3">
                {(order.items || []).map((item, index) => (
                  <div key={`${item.product || item.name}-${index}`} className="border-b pb-3 last:border-b-0 last:pb-0" style={{ borderColor: 'var(--admin-border)' }}>
                    <div className="font-semibold">{item.name}</div>
                    <div className="mt-1 flex justify-between text-sm" style={{ color: 'var(--admin-muted)' }}>
                      <span>{item.quantity} x {formatPrice(item.price)}</span>
                      <span>{formatPrice(Number(item.quantity || 0) * Number(item.price || 0))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 border p-4" style={{ borderColor: 'var(--admin-border)' }}>
              <h4 className="font-bold">Order Summary</h4>
              <DetailRow label="Subtotal" value={formatPrice(order.subtotal)} />
              {Number(order.discount || 0) > 0 && <DetailRow label="Discount" value={formatPrice(order.discount)} />}
              <DetailRow label="VAT (13%)" value={formatPrice(order.vatAmount)} />
              <DetailRow label="Delivery" value={formatPrice(order.deliveryCharge)} />
              <div className="border-t pt-3" style={{ borderColor: 'var(--admin-border)' }}>
                <DetailRow label="Total" value={<span className="text-lg">{formatPrice(order.grandTotal)}</span>} />
              </div>
            </section>

            <section className="space-y-3 border p-4" style={{ borderColor: 'var(--admin-border)' }}>
              <h4 className="font-bold">Payment</h4>
              <DetailRow label="Method" value={<PaymentBadge method={order.paymentMethod} />} />
              <DetailRow label="Status" value={<StatusBadge status={order.paymentStatus} />} />
              {order.paymentRef && <DetailRow label="Reference" value={order.paymentRef} />}
            </section>

            <section className="space-y-3 border p-4" style={{ borderColor: 'var(--admin-border)' }}>
              <h4 className="font-bold">Status Update</h4>
              <DetailRow label="Current" value={<StatusBadge status={order.orderStatus} />} />
              <OrderStatusSelect value={status} onChange={setStatus} disabled={updateStatus.isPending} />
              <button
                className="admin-button admin-button-primary w-full"
                type="button"
                disabled={updateStatus.isPending || status === order.orderStatus}
                onClick={saveStatus}
              >
                {updateStatus.isPending && <Spinner size="sm" color="currentColor" />}
                Update Status
              </button>
            </section>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}

export default function AdminOrders() {
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    page: 1,
    limit: 20,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { data, isLoading } = useAdminOrders(filters);
  const updateStatus = useUpdateOrderStatus();
  const orders = data?.items || [];

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const columns = [
    {
      key: '_id',
      label: 'Order #',
      render: (value) => <span className="font-mono text-xs">#{value?.slice(-8)}</span>,
    },
    {
      key: 'user',
      label: 'Customer',
      render: (value) => value?.name || 'Guest',
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: formatDate,
    },
    {
      key: 'items',
      label: 'Items',
      render: (value) => `${value?.length || 0} items`,
    },
    {
      key: 'grandTotal',
      label: 'Total',
      render: formatPrice,
    },
    {
      key: 'paymentMethod',
      label: 'Payment',
      render: (value) => <PaymentBadge method={value} />,
    },
    {
      key: 'orderStatus',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 220,
      render: (_, row) => (
        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
          <button className="admin-button admin-icon-button" type="button" title="View" onClick={() => setSelectedOrder(row)}>
            <Eye size={15} />
          </button>
          <OrderStatusSelect
            value={row.orderStatus}
            disabled={updateStatus.isPending}
            onChange={(status) => updateStatus.mutate({ id: row._id, status })}
          />
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Orders" breadcrumb="Orders">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Orders</h2>
          <span className="admin-badge" style={{ background: '#24283A', borderColor: 'var(--admin-border)', color: 'var(--admin-muted)' }}>
            {data?.total || 0} total
          </span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <select className="admin-select w-full sm:w-[180px]" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="">All order status</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select className="admin-select w-full sm:w-[190px]" value={filters.paymentStatus} onChange={(event) => updateFilter('paymentStatus', event.target.value)}>
            <option value="">All payment status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="pending_collection">COD Pending</option>
          </select>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={orders}
        loading={isLoading}
        emptyMessage="No orders match the current filters"
        onRowClick={setSelectedOrder}
      />
      <AdminPagination
        page={filters.page}
        totalPages={data?.totalPages || 1}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
      />

      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          updateStatus={updateStatus}
        />
      )}
    </AdminLayout>
  );
}
