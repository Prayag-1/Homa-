import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';
import Spinner from '../ui/Spinner';

export default function Navbar({ onCartOpen }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const moreRef = useRef(null);
  const inputRef = useRef(null);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        closeSearch();
      }
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setSearchLoading(false);
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await api.get('/products/search', {
          params: { q: trimmed },
        });
        const payload = data?.data;
        setResults(Array.isArray(payload) ? payload : payload?.items || []);
      } catch (error) {
        console.error('Product search failed:', error);
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  };

  const closeMoreMenu = () => {
    setMoreOpen(false);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') closeSearch();
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all ${scrolled ? 'backdrop-blur bg-white/80 border-b border-gray-200' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-3xl font-display font-semibold text-black">HOMA</Link>

        <div className="hidden md:flex gap-8">
          <Link to="/" className="text-black hover:text-red-500 transition">Home</Link>
          <Link to="/shop" className="text-black hover:text-red-500 transition">Shop</Link>
          <Link to="/user/dashboard" className="text-black hover:text-red-500 transition">Dashboard</Link>
          <Link to="/blog" className="text-black hover:text-red-500 transition">Blog</Link>
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              className="inline-flex items-center gap-1 text-black hover:text-red-500 transition"
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
                  className="absolute left-0 top-full mt-3 w-56 overflow-hidden border border-gray-200 bg-white shadow-xl"
                  role="menu"
                >
                  {[
                    { to: '/about', label: 'About Homa' },
                    { to: '/distributors', label: 'Authorized Dealers' },
                    { to: '/transformations', label: 'Transformation Stories' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeMoreMenu}
                      className="block px-4 py-3 text-sm text-black hover:bg-gray-50 hover:text-red-500 transition"
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden md:flex gap-4 items-center">
          <div ref={searchRef} className="relative flex items-center">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Search products"
            >
              <Search size={20} />
            </button>
            <motion.input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              initial={false}
              animate={{ width: searchOpen ? 240 : 0, opacity: searchOpen ? 1 : 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="ml-1 border-b border-gray-300 bg-transparent py-2 font-body text-sm outline-none"
              placeholder="Search products"
              aria-label="Search products"
            />

            <AnimatePresence>
              {searchOpen && query.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-full mt-3 w-96 overflow-hidden bg-white shadow-xl border border-gray-200"
                >
                  {searchLoading ? (
                    <div className="flex items-center gap-2 px-4 py-5 font-body text-sm text-gray-600">
                      <Spinner size="sm" />
                      <span>Searching...</span>
                    </div>
                  ) : results.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      {results.map((product) => {
                        const id = product._id || product.id;
                        const image = product.images?.[0]?.url || product.image || '/placeholder.jpg';

                        return (
                          <Link
                            key={id}
                            to={`/products/${id}`}
                            onClick={closeSearch}
                            className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <img
                              src={image}
                              alt={product.name}
                              className="h-14 w-14 flex-shrink-0 object-cover bg-gray-100"
                              loading="lazy"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-display text-base text-black">
                                {product.name}
                              </p>
                              <p className="truncate font-body text-xs uppercase tracking-widest text-red-600">
                                {product.brand}
                              </p>
                              <p className="font-body text-sm font-semibold text-black">
                                {formatPrice(product.price)}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-5 font-body text-sm text-gray-600">
                      No products found for &apos;{query.trim()}&apos;
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/wishlist" className="p-2 hover:bg-gray-100 rounded-lg transition" aria-label="Wishlist">
            <Heart size={20} />
          </Link>
          <button
            type="button"
            onClick={onCartOpen}
            className="p-2 hover:bg-gray-100 rounded-lg transition relative"
            aria-label="Open cart"
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
          {user ? (
            <div className="flex gap-2 items-center">
              <span className="px-3 py-1 text-sm">Welcome, {user.name}</span>
              <Link to="/user/dashboard" className="px-3 py-1 text-sm border border-black/10 rounded hover:bg-gray-100 transition">
                Dashboard
              </Link>
              <button onClick={logout} className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-900">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-900">Login</Link>
          )}
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Open menu">
          <Menu size={24} />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col p-4 gap-4 md:hidden">
          <button onClick={() => setIsOpen(false)} className="self-start p-2" aria-label="Close menu">
            <X size={24} />
          </button>
          <Link to="/" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/shop" onClick={() => setIsOpen(false)}>Shop</Link>
          <Link to="/wishlist" onClick={() => setIsOpen(false)}>Wishlist</Link>
          <Link to="/user/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
          <Link to="/blog" onClick={() => setIsOpen(false)}>Blog</Link>
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">More</div>
            <Link to="/about" onClick={() => setIsOpen(false)} className="block pl-3">About Homa</Link>
            <Link to="/distributors" onClick={() => setIsOpen(false)} className="block pl-3">Authorized Dealers</Link>
            <Link to="/transformations" onClick={() => setIsOpen(false)} className="block pl-3">Transformation Stories</Link>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onCartOpen?.();
            }}
            className="text-left"
          >
            Cart ({itemCount})
          </button>
          {user ? (
            <div className="flex flex-col gap-3">
              <Link to="/user/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout} className="text-left">Logout</button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}
