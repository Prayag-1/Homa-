import {
  BarChart3,
  FileText,
  Grid3X3,
  LayoutDashboard,
  LogOut,
  MapPin,
  Sparkles,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import HomaLogo from '../common/HomaLogo';

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Brands', to: '/admin/brands', icon: Tag },
  { label: 'Categories', to: '/admin/categories', icon: Grid3X3 },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Customers', to: '/admin/customers', icon: Users },
  { label: 'Blogs', to: '/admin/blogs', icon: FileText },
  { label: 'Transformation Stories', to: '/admin/transformations', icon: Sparkles },
  { label: 'Distributors', to: '/admin/distributors', icon: MapPin },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
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
          <HomaLogo variant="white" size="sm" />
          <div className="mt-3 inline-flex rounded-full bg-[var(--admin-accent)] px-2 py-1 font-body text-[10px] font-bold uppercase tracking-[0.12em] text-white">
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
                    'mx-3 mb-1 flex h-10 items-center gap-3 rounded-lg px-4 font-body text-[13px] font-semibold transition-colors',
                    isActive
                      ? 'bg-[var(--admin-accent)] text-white'
                      : 'text-[var(--admin-muted)] hover:bg-[rgba(209,0,0,0.1)] hover:text-[var(--admin-text)]',
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
          style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}
        >
          <div>
            <h1 className="font-heading text-[22px] font-semibold">{title}</h1>
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
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-accent)] text-sm font-black text-white">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
