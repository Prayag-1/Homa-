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
        <CartesianGrid strokeDasharray="3 3" stroke="#3D1515" />
        <XAxis
          type="number"
          tick={{ fill: '#9A8080', fontSize: 11 }}
          tickFormatter={(value) => `NPR ${(value / 1000).toFixed(0)}k`}
        />
        <YAxis dataKey="category" type="category" tick={{ fill: '#9A8080', fontSize: 11 }} width={120} />
        <Tooltip
          contentStyle={{ background: '#1F1212', border: '1px solid #3D1515', borderRadius: 8, color: '#F9F5F2' }}
          formatter={(value, name) => [
            name === 'unitsSold' ? value.toLocaleString() : `NPR ${Number(value).toLocaleString('en-NP')}`,
            name === 'unitsSold' ? 'Units Sold' : 'Revenue',
          ]}
        />
        <Bar dataKey="revenue" fill="#D10000" radius={[0, 0, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
