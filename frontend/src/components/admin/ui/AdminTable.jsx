export default function AdminTable({
  columns,
  data,
  loading,
  onRowClick,
  emptyMessage = 'No records found',
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ width: column.width }}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: 5 }).map((_, rowIndex) => (
            <tr key={`skeleton-${rowIndex}`}>
              {columns.map((column) => (
                <td key={column.key}>
                  <div className="admin-skeleton" style={{ width: column.width || '100%' }} />
                </td>
              ))}
            </tr>
          ))}

          {!loading && data?.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="h-32 text-center" style={{ color: 'var(--admin-muted)' }}>
                {emptyMessage}
              </td>
            </tr>
          )}

          {!loading && data?.map((row) => (
            <tr
              key={row._id || row.id}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((column) => {
                const value = row[column.key];
                return (
                  <td key={column.key}>
                    {column.render ? column.render(value, row) : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
