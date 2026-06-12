import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function CategoryBarChart({ data }) {
  if (data === undefined) return <div className="admin-skeleton h-[300px] w-full" />;

  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm" style={{ color: 'var(--admin-muted)' }}>
        No data for this period
      </div>
    );
  }

  const chartData = data.map((item) => ({ ...item, category: item._id || 'Uncategorized' }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3148" />
        <XAxis
          type="number"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(value) => `NPR ${(value / 1000).toFixed(0)}k`}
        />
        <YAxis dataKey="category" type="category" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={120} />
        <Tooltip
          contentStyle={{ background: '#1F2232', border: '1px solid #2D3148', borderRadius: 0, color: '#F9FAFB' }}
          formatter={(value, name) => [
            name === 'unitsSold' ? value.toLocaleString() : `NPR ${Number(value).toLocaleString('en-NP')}`,
            name === 'unitsSold' ? 'Units Sold' : 'Revenue',
          ]}
        />
        <Bar dataKey="revenue" fill="#C8432B" radius={[0, 0, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
