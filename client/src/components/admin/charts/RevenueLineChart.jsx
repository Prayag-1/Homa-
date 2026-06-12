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
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3148" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(value) => `NPR ${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{ background: '#1F2232', border: '1px solid #2D3148', borderRadius: 0, color: '#F9FAFB' }}
          formatter={(value, name) => [
            name === 'orders' ? value.toLocaleString() : `NPR ${Number(value).toLocaleString('en-NP')}`,
            name === 'orders' ? 'Orders' : 'Revenue',
          ]}
        />
        <Line type="monotone" dataKey="revenue" stroke="#C8432B" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
