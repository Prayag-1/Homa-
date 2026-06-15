import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const chartHeight = 300;

export default function RevenueLineChart({ data }) {
  if (data === undefined) {
    return <div className="admin-skeleton h-[300px] w-full" />;
  }

  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm" style={{ color: 'var(--admin-muted)' }}>
        No data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3D1515" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#9A8080', fontSize: 11 }}
          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis
          tick={{ fill: '#9A8080', fontSize: 11 }}
          tickFormatter={(value) => `NPR ${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{ background: '#1F1212', border: '1px solid #3D1515', borderRadius: 8, color: '#F9F5F2' }}
          formatter={(value, name) => [
            name === 'orders' ? value.toLocaleString() : `NPR ${Number(value).toLocaleString('en-NP')}`,
            name === 'orders' ? 'Orders' : 'Revenue',
          ]}
        />
        <Line type="monotone" dataKey="revenue" stroke="#D10000" strokeWidth={2} dot={{ fill: '#D10000' }} activeDot={{ r: 4, fill: '#D10000' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
