import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminProductForm() {
  return (
    <AdminLayout title="Product Form" breadcrumb="Products">
      <div className="admin-card p-6">
        <h2 className="text-lg font-bold">Product form</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--admin-muted)' }}>
          Product create and edit fields are scheduled for Prompt 3.
        </p>
      </div>
    </AdminLayout>
  );
}
