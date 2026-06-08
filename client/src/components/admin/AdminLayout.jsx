import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Customers', to: '/admin/customers', icon: Users },
  { label: 'Blogs', to: '/admin/blogs', icon: FileText },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
];

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'A';

export default function AdminLayout({ title, breadcrumb = title, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="admin-shell min-h-screen">
      <aside
        className="fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col border-r"
        style={{ background: 'var(--admin-sidebar)', borderColor: 'var(--admin-border)' }}
      >
        <div className="border-b px-5 py-5" style={{ borderColor: 'var(--admin-border)' }}>
          <div className="text-2xl font-black tracking-[0.18em]">HOMA</div>
          <div className="mt-2 inline-flex border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ borderColor: 'var(--admin-accent)', color: '#FCA5A5' }}>
            Admin
          </div>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  [
                    'mb-1 flex h-10 items-center gap-3 border-l-4 px-4 text-sm font-semibold transition-colors',
                    isActive
                      ? 'border-[var(--admin-accent)] bg-[#24283A] text-[var(--admin-text)]'
                      : 'border-transparent text-[var(--admin-muted)] hover:bg-[#222637] hover:text-[var(--admin-text)]',
                  ].join(' ')
                }
              >
                <Icon size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t p-4" style={{ borderColor: 'var(--admin-border)' }}>
          <div className="mb-3 truncate text-xs" style={{ color: 'var(--admin-muted)' }}>
            {user?.email}
          </div>
          <button className="admin-button w-full" type="button" onClick={logout}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      <div className="ml-[240px] flex min-h-screen flex-col">
        <header
          className="sticky top-0 z-20 flex h-16 items-center justify-between border-b px-6"
          style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}
        >
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <div className="mt-1 text-xs" style={{ color: 'var(--admin-muted)' }}>
              Admin &gt; {breadcrumb}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold">{user?.name || 'Admin'}</div>
              <div className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                Administrator
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center bg-[var(--admin-accent)] text-sm font-black">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
