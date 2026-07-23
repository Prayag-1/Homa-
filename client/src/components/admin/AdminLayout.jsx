import {
  BarChart3,
  Image as ImageIcon,
  FileText,
  Grid3X3,
  LogOut,
  Menu,
  MapPin,
  MessageCircle,
  Sparkles,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  X,
  Users,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import HomaLogo from '../common/HomaLogo';

const navItems = [
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Brands', to: '/admin/brands', icon: Tag },
  { label: 'Categories', to: '/admin/categories', icon: Grid3X3 },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Return Requests', to: '/admin/returns', icon: RotateCcw },
  { label: 'Customers', to: '/admin/customers', icon: Users },
  { label: 'Contact Inquiries', to: '/admin/contact-inquiries', icon: MessageCircle },
  { label: 'Blogs', to: '/admin/blogs', icon: FileText },
  { label: 'Transformation Stories', to: '/admin/transformations', icon: Sparkles },
  { label: 'Distributors', to: '/admin/distributors', icon: MapPin },
  { label: 'Hero Banners', to: '/admin/banners', icon: ImageIcon },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-shell min-h-screen">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={closeSidebar}
          aria-label="Close admin navigation overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(280px,85vw)] flex-col border-r transition-transform duration-200 lg:w-[240px] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ background: 'var(--admin-sidebar)', borderColor: 'var(--admin-border)' }}
      >
        <div className="border-b px-5 py-5" style={{ borderColor: 'var(--admin-border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <HomaLogo variant="white" size="sm" />
              <div className="mt-3 inline-flex rounded-full bg-[var(--admin-accent)] px-2 py-1 font-body text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                Admin
              </div>
            </div>
            <button
              type="button"
              className="admin-button admin-icon-button lg:hidden"
              onClick={closeSidebar}
              aria-label="Close admin navigation"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                onClick={closeSidebar}
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

      <div className="flex min-h-screen flex-col lg:ml-[240px]">
        <header
          className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6"
          style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="admin-button admin-icon-button lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin navigation"
            >
              <Menu size={16} />
            </button>
            <div className="min-w-0">
            <h1 className="truncate font-heading text-lg font-semibold sm:text-[22px]">{title}</h1>
            <div className="mt-1 truncate text-xs" style={{ color: 'var(--admin-muted)' }}>
              Admin &gt; {breadcrumb}
            </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
