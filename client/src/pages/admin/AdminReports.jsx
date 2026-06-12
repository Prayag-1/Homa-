import {
  BarChart3,
  Calculator,
  Download,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DateRangePicker from '../../components/admin/ui/DateRangePicker';
import CategoryBarChart from '../../components/admin/charts/CategoryBarChart';
import PaymentPieChart from '../../components/admin/charts/PaymentPieChart';
import RevenueLineChart from '../../components/admin/charts/RevenueLineChart';
import Spinner from '../../components/ui/Spinner';
import {
  defaultReportRange,
  downloadCSV,
  useCategoryRevenue,
  useDailyRevenue,
  usePaymentStats,
  useSalesOverview,
} from '../../hooks/useReports';
import { formatPrice } from '../../utils/formatPrice';

const statusStyles = {
  pending: { color: '#FCD34D', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' },
  processing: { color: '#93C5FD', bg: 'rgba(37, 99, 235, 0.12)', border: 'rgba(37, 99, 235, 0.35)' },
  shipped: { color: '#5EEAD4', bg: 'rgba(20, 184, 166, 0.12)', border: 'rgba(20, 184, 166, 0.35)' },
  delivered: { color: '#6EE7B7', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)' },
  cancelled: { color: '#FCA5A5', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)' },
};

const statusLabels = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function SummaryCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="admin-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--admin-muted)' }}>
            {label}
          </p>
          {loading ? (
            <div className="admin-skeleton mt-4 h-7 w-28" />
          ) : (
            <div className="mt-3 text-2xl font-black">{value}</div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center border" style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-accent)' }}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function AdminReports() {
  const [dateRange, setDateRange] = useState(defaultReportRange);
  const [exporting, setExporting] = useState(false);

  const overview = useSalesOverview(dateRange);
  const dailyRevenue = useDailyRevenue(dateRange);
  const categoryRevenue = useCategoryRevenue(dateRange);
  const paymentStats = usePaymentStats(dateRange);
  const summary = overview.data?.summary || {};
  const ordersByStatus = overview.data?.ordersByStatus || [];
  const topProducts = overview.data?.topProducts || [];

  const statusCount = (status) => ordersByStatus.find((item) => item._id === status)?.count || 0;

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadCSV(dateRange);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout title="Reports" breadcrumb="Reports">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--admin-muted)' }}>
            Sales, payment, category, and order performance.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button className="admin-button admin-button-primary mt-[42px]" type="button" onClick={handleExport} disabled={exporting}>
            {exporting ? <Spinner size="sm" color="currentColor" /> : <Download size={16} />}
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={TrendingUp} label="Total Revenue" value={formatPrice(summary.totalRevenue)} loading={overview.isLoading} />
        <SummaryCard icon={ShoppingCart} label="Total Orders" value={Number(summary.totalOrders || 0).toLocaleString()} loading={overview.isLoading} />
        <SummaryCard icon={Calculator} label="Average Order Value" value={formatPrice(summary.averageOrder)} loading={overview.isLoading} />
        <SummaryCard icon={Users} label="New Customers" value={Number(summary.newCustomers || 0).toLocaleString()} loading={overview.isLoading} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,65fr)_minmax(320px,35fr)]">
        <section className="admin-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} style={{ color: 'var(--admin-accent)' }} />
            <h3 className="font-bold">Daily Revenue</h3>
          </div>
          <RevenueLineChart data={dailyRevenue.isLoading ? undefined : dailyRevenue.data || []} />
        </section>
        <section className="admin-card p-4">
          <h3 className="mb-4 font-bold">Payment Methods</h3>
          <PaymentPieChart data={paymentStats.isLoading ? undefined : paymentStats.data || []} />
        </section>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="admin-card p-4">
          <h3 className="mb-4 font-bold">Revenue by Category</h3>
          <CategoryBarChart data={categoryRevenue.isLoading ? undefined : categoryRevenue.data || []} />
        </section>
        <section className="admin-card p-4">
          <h3 className="mb-4 font-bold">Top Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-muted)' }}>
                  <th className="py-3 pr-3">Rank</th>
                  <th className="py-3 pr-3">Product Name</th>
                  <th className="py-3 pr-3 text-right">Units Sold</th>
                  <th className="py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {overview.isLoading && Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="py-3" colSpan="4"><div className="admin-skeleton h-4 w-full" /></td>
                  </tr>
                ))}
                {!overview.isLoading && topProducts.length === 0 && (
                  <tr>
                    <td className="py-10 text-center" colSpan="4" style={{ color: 'var(--admin-muted)' }}>
                      No products sold in this period
                    </td>
                  </tr>
                )}
                {!overview.isLoading && topProducts.map((product, index) => (
                  <tr key={product._id || product.name} className="border-b" style={{ borderColor: 'var(--admin-border)' }}>
                    <td className="py-3 pr-3 font-bold">#{index + 1}</td>
                    <td className="py-3 pr-3">{product.name}</td>
                    <td className="py-3 pr-3 text-right">{Number(product.unitsSold || 0).toLocaleString()}</td>
                    <td className="py-3 text-right">{formatPrice(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="admin-card p-4">
        <h3 className="mb-4 font-bold">Order Status</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {statusLabels.map((status) => {
            const style = statusStyles[status];
            return (
              <div key={status} className="border p-3" style={{ background: style.bg, borderColor: style.border }}>
                <div className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: style.color }}>
                  {status}
                </div>
                <div className="mt-2 text-2xl font-black">{statusCount(status)}</div>
              </div>
            );
          })}
        </div>
      </section>
    </AdminLayout>
  );
}
