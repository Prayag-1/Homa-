import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const colors = {
  esewa: '#6EC207',
  fonepay: '#2563EB',
  cod: '#F59E0B',
};

const methodLabel = (method = '') => {
  if (method.toLowerCase() === 'cod') return 'COD';
  if (method.toLowerCase() === 'esewa') return 'eSewa';
  return method || 'Unknown';
};

export default function PaymentPieChart({ data }) {
  if (data === undefined) return <div className="admin-skeleton h-[300px] w-full" />;

  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm" style={{ color: 'var(--admin-muted)' }}>
        No data for this period
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="_id"
            cx="50%"
            cy="50%"
            outerRadius={78}
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            {data.map((item) => (
              <Cell key={item._id || 'unknown'} fill={colors[item._id] || '#9CA3AF'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1F2232', border: '1px solid #2D3148', borderRadius: 0, color: '#F9FAFB' }}
            formatter={(value, name, item) => [
              `${value.toLocaleString()} orders`,
              methodLabel(item.payload?._id),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item._id || 'unknown'} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3" style={{ background: colors[item._id] || '#9CA3AF' }} />
              <span>{methodLabel(item._id)}</span>
            </div>
            <span style={{ color: 'var(--admin-muted)' }}>
              {item.count} of {total} - NPR {Number(item.revenue || 0).toLocaleString('en-NP')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
