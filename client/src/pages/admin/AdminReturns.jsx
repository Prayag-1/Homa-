import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminTable from '../../components/admin/ui/AdminTable';
import Spinner from '../../components/ui/Spinner';
import { formatPrice } from '../../utils/formatPrice';
import { adminGetReturnRequests, adminUpdateReturnRequest } from '../../services/returnService';

const STATUS_COLORS = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  accepted: { bg: '#DCFCE7', text: '#166534' },
  rejected: { bg: '#FEE2E2', text: '#991B1B' },
};

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#374151' };

  return (
    <span
      className="inline-flex px-2 py-1 text-xs font-bold uppercase"
      style={{
        background: colors.bg,
        color: colors.text,
        fontSize: '11px',
      }}
    >
      {status || 'unknown'}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm py-1">
      <span style={{ color: 'var(--admin-muted)' }}>{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function ReturnDetailPanel({ request, onClose, refetch }) {
  const [adminNotes, setAdminNotes] = useState(request?.adminNotes || '');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, status, adminNotes }) =>
      adminUpdateReturnRequest(id, { status, adminNotes }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
      toast.success(res.message || 'Return request updated');
      refetch();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update return request');
    },
  });

  if (!request) return null;

  const handleAction = async (status) => {
    await updateMutation.mutateAsync({
      id: request._id,
      status,
      adminNotes,
    });
  };

  const order = request.order || {};
  const user = request.user || {};

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
              <h3 className="text-xl font-bold">Return Request #{request._id?.slice(-8)}</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
                Requested on {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button className="admin-button admin-icon-button" type="button" onClick={onClose} aria-label="Close details">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-6 text-[var(--admin-text)]">
            {/* Return Request Info */}
            <section className="space-y-3 border p-4" style={{ borderColor: 'var(--admin-border)' }}>
              <h4 className="font-bold border-b pb-2" style={{ borderColor: 'var(--admin-border)' }}>Return Reason</h4>
              <p className="text-sm font-semibold text-red-500">{request.reason}</p>
              {request.details && (
                <div>
                  <p className="text-xs text-gray-400">Additional Details:</p>
                  <p className="text-sm bg-black/20 p-2.5 rounded mt-1 whitespace-pre-wrap">{request.details}</p>
                </div>
              )}
              <DetailRow label="Current Status" value={<StatusBadge status={request.status} />} />
            </section>

            {/* Customer Details */}
            <section className="space-y-3 border p-4" style={{ borderColor: 'var(--admin-border)' }}>
              <h4 className="font-bold border-b pb-2" style={{ borderColor: 'var(--admin-border)' }}>Customer Info</h4>
              <DetailRow label="Name" value={user.name || 'Guest'} />
              <DetailRow label="Email" value={user.email || '--'} />
              <DetailRow label="Phone" value={user.phone || order.shippingAddress?.phone || '--'} />
            </section>

            {/* Order Items */}
            <section className="border p-4" style={{ borderColor: 'var(--admin-border)' }}>
              <h4 className="mb-3 font-bold border-b pb-2" style={{ borderColor: 'var(--admin-border)' }}>Order Info</h4>
              <DetailRow label="Order ID" value={`#${order._id?.slice(-8) || '--'}`} />
              <DetailRow label="Invoice" value={order.invoiceNumber || 'N/A'} />
              <DetailRow label="Order Date" value={order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '--'} />
              <DetailRow label="Order Status" value={<span className="uppercase text-xs font-semibold">{order.orderStatus}</span>} />
              
              <div className="mt-4 pt-3 border-t space-y-2" style={{ borderColor: 'var(--admin-border)' }}>
                <p className="font-bold text-xs uppercase text-gray-400 mb-2">Items to Return:</p>
                {(order.items || []).map((item, index) => (
                  <div key={index} className="flex justify-between text-xs py-1">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 font-bold" style={{ borderColor: 'var(--admin-border)' }}>
                  <DetailRow label="Refund Total" value={<span className="text-lg text-green-500">{formatPrice(order.grandTotal)}</span>} />
                </div>
              </div>
            </section>

            {/* Admin Action section */}
            <section className="space-y-3 border p-4" style={{ borderColor: 'var(--admin-border)' }}>
              <h4 className="font-bold border-b pb-2" style={{ borderColor: 'var(--admin-border)' }}>Admin Notes & Actions</h4>
              
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Admin Response Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="E.g., Return approved, item will be picked up..."
                  rows={3}
                  className="w-full bg-[#1F2232] text-white border border-[#2D3148] rounded px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  disabled={request.status !== 'pending' || updateMutation.isPending}
                />
              </div>

              {request.status === 'pending' ? (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleAction('rejected')}
                    className="admin-button w-1/2 justify-center border border-red-500 text-red-500 hover:bg-red-500/10 font-bold"
                    type="button"
                    disabled={updateMutation.isPending}
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={() => handleAction('accepted')}
                    className="admin-button admin-button-primary w-1/2 justify-center font-bold"
                    type="button"
                    disabled={updateMutation.isPending}
                  >
                    Accept Return
                  </button>
                </div>
              ) : (
                <div className="text-center py-2 text-sm font-semibold bg-white/5 rounded border border-white/10 text-gray-400">
                  This request has already been <span className="uppercase text-white font-bold">{request.status}</span>
                </div>
              )}
            </section>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}

export default function AdminReturns() {
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-returns'],
    queryFn: () => adminGetReturnRequests().then((res) => res.data),
    staleTime: 1000 * 30,
  });

  const requests = data || [];

  const columns = [
    {
      key: '_id',
      label: 'Request #',
      render: (value) => <span className="font-mono text-xs">#{value?.slice(-8)}</span>,
    },
    {
      key: 'order',
      label: 'Order Info',
      render: (order) => (
        <div className="text-xs leading-normal text-left">
          <p className="font-semibold text-white">#{order?._id?.slice(-8)}</p>
          <p className="text-gray-400">{order?.invoiceNumber || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'Customer',
      render: (user, row) => (
        <div className="text-xs text-left">
          <p className="font-semibold">{user?.name || 'Guest'}</p>
          <p className="text-gray-400">{user?.email || row.order?.shippingAddress?.phone || ''}</p>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (value) => <span className="text-xs font-medium text-red-400">{value}</span>,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => (value ? new Date(value).toLocaleDateString() : '--'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 120,
      render: (_, row) => (
        <button
          className="admin-button admin-icon-button"
          type="button"
          title="Review Request"
          onClick={() => setSelectedRequest(row)}
        >
          <Eye size={15} />
          <span className="text-xs font-semibold ml-1.5">Review</span>
        </button>
      ),
    },
  ];

  return (
    <AdminLayout title="Return Requests" breadcrumb="Return Requests">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Return Requests</h2>
          <span className="admin-badge" style={{ background: '#24283A', borderColor: 'var(--admin-border)', color: 'var(--admin-muted)' }}>
            {requests.length} total
          </span>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={requests}
        loading={isLoading}
        emptyMessage="No return requests found"
        onRowClick={setSelectedRequest}
      />

      {selectedRequest && (
        <ReturnDetailPanel
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          refetch={refetch}
        />
      )}
    </AdminLayout>
  );
}
