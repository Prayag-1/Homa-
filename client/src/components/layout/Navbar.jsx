import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { useScrollDirection } from '../../hooks/useScrollDirection';

const mainLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/user/dashboard', label: 'Dashboard' },
  { to: '/blog', label: 'Blog' },
];

const moreLinks = [
  { to: '/about', label: 'About Homa' },
  { to: '/distributors', label: 'Authorized Dealers' },
  { to: '/transformations', label: 'Transformation Stories' },
  { to: '/contact', label: 'Contact Us' },
];

const navClass = 'font-body text-sm font-medium text-[#1A1410] transition-colors duration-200 hover:text-[#C8432B]';
const iconClass = 'text-[#1A1410] transition-colors duration-200 hover:text-[#C8432B]';

export default function Navbar({ onCartOpen }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const { isTop } = useScrollDirection();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchValue('');
  };

  const submitSearch = () => {
    const query = searchValue.trim();
    if (!query) return;
    navigate(`/shop?search=${encodeURIComponent(query)}`);
    closeSearch();
  };

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    closeMobile();
  };

  const cartCount = itemCount > 9 ? '9+' : itemCount;

  const CartButton = ({ mobile = false }) => (
    <button
      type="button"
      className={`relative inline-flex ${iconClass}`}
      onClick={onCartOpen}
      aria-label="Open cart"
    >
      <ShoppingBag size={mobile ? 22 : 20} />
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C8432B] px-1 font-body text-[10px] font-bold leading-none text-white">
          {cartCount}
        </span>
      )}
    </button>
  );

  return (
    <>
      <motion.header
        className="fixed left-0 right-0 top-0 z-50 w-full"
        animate={{
          backgroundColor: isTop ? 'rgba(253, 250, 247, 0.82)' : 'rgba(253, 250, 247, 0.95)',
          borderBottomColor: isTop ? 'rgba(26, 20, 16, 0.04)' : 'rgba(26, 20, 16, 0.08)',
          boxShadow: isTop ? '0 0 0 rgba(26, 20, 16, 0)' : '0 1px 20px rgba(26, 20, 16, 0.06)',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          borderBottomWidth: 1,
          borderBottomStyle: 'solid',
          backdropFilter: isTop ? 'none' : 'blur(12px)',
        }}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 md:px-12">
          <Link to="/" className="font-display text-[28px] font-semibold leading-none text-[#1A1410]">
            HOMA
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {mainLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`${navClass} ${isActive(link.to) ? 'text-[#C8432B]' : ''}`}
              >
                {link.label}
              </Link>
            ))}

            <div ref={moreRef} className="relative">
              <button
                type="button"
                className={`inline-flex items-center gap-1 ${navClass} ${
                  moreLinks.some((link) => isActive(link.to)) ? 'text-[#C8432B]' : ''
                }`}
                onClick={() => setMoreOpen((current) => !current)}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                More
                <ChevronDown size={15} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute left-0 top-full mt-5 w-56 border border-black/5 bg-white py-2 shadow-xl"
                    role="menu"
                  >
                    {moreLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMoreOpen(false)}
                        className="block px-4 py-3 font-body text-sm font-medium text-[#1A1410] transition-colors hover:text-[#C8432B]"
                        role="menuitem"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <button
              type="button"
              className={`inline-flex ${iconClass}`}
              onClick={() => setSearchOpen((current) => !current)}
              aria-label="Search products"
            >
              <Search size={20} />
            </button>
            <Link to="/wishlist" className={`inline-flex ${iconClass}`} aria-label="Wishlist">
              <Heart size={20} />
            </Link>
            <CartButton />

            {user ? (
              <div className="flex items-center gap-3">
                <span className="font-body text-sm font-medium text-[#1A1410]">
                  Welcome, {user.name}
                </span>
                <Link
                  to="/user/dashboard"
                  className="border border-black/10 px-4 py-2 font-body text-sm font-medium text-[#1A1410] transition-colors hover:border-[#C8432B] hover:text-[#C8432B]"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  className="bg-black px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[#C8432B]"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-black px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[#C8432B]"
              >
                Login
              </Link>
            )}
          </div>

          <div className="flex items-center gap-5 md:hidden">
            <button
              type="button"
              className={`inline-flex ${iconClass}`}
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <CartButton mobile />
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 56, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden border-b border-[#E5E7EB] bg-white"
            >
              <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-6 md:px-12">
                <Search size={20} className="text-[#1A1410]" />
                <input
                  autoFocus
                  className="h-full flex-1 bg-transparent font-body text-sm text-[#1A1410] outline-none placeholder:text-gray-400"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submitSearch();
                    if (event.key === 'Escape') closeSearch();
                  }}
                  placeholder="Search products..."
                  aria-label="Search products"
                />
                <button type="button" className={iconClass} onClick={closeSearch} aria-label="Close search">
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex bg-[#1A1410] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <button
              type="button"
              className="absolute right-6 top-6 text-white transition-colors duration-200 hover:text-[#C8432B]"
              onClick={closeMobile}
              aria-label="Close menu"
            >
              <X size={28} />
            </button>

            <nav className="m-auto flex flex-col items-center gap-6">
              {[...mainLinks, ...moreLinks, { to: '/wishlist', label: 'Wishlist' }].map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * index, duration: 0.22, ease: 'easeOut' }}
                >
                  <Link
                    to={link.to}
                    className="font-display text-[30px] leading-tight text-white transition-colors duration-200 hover:text-[#C8432B]"
                    onClick={closeMobile}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <button
                type="button"
                className="font-display text-[30px] leading-tight text-white transition-colors duration-200 hover:text-[#C8432B]"
                onClick={() => {
                  closeMobile();
                  setSearchOpen(true);
                }}
              >
                Search
              </button>
              {user ? (
                <button
                  type="button"
                  className="font-display text-[30px] leading-tight text-white transition-colors duration-200 hover:text-[#C8432B]"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="font-display text-[30px] leading-tight text-white transition-colors duration-200 hover:text-[#C8432B]"
                  onClick={closeMobile}
                >
                  Login
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
