import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 transition-all ${scrolled ? 'backdrop-blur bg-white/80 border-b border-gray-200' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-3xl font-display font-semibold text-black">HOMA</Link>

        <div className="hidden md:flex gap-8">
          <Link to="/" className="text-black hover:text-red-500 transition">Home</Link>
          <Link to="/shop" className="text-black hover:text-red-500 transition">Shop</Link>
          <Link to="/user/dashboard" className="text-black hover:text-red-500 transition">Dashboard</Link>
          <Link to="/blog" className="text-black hover:text-red-500 transition">Blog</Link>
          <Link to="/about" className="text-black hover:text-red-500 transition">About</Link>
          <Link to="/distributors" className="text-black hover:text-red-500 transition">Distributors</Link>
        </div>

        <div className="hidden md:flex gap-4 items-center">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">ðŸ”</button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">â¤ï¸</button>
          <Link to="/cart" className="p-2 hover:bg-gray-100 rounded-lg transition relative">
            ðŸ›’
            {itemCount > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{itemCount}</span>}
          </Link>
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

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>â˜°</button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col p-4 gap-4 md:hidden">
          <button onClick={() => setIsOpen(false)} className="text-2xl">âœ•</button>
          <Link to="/" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/shop" onClick={() => setIsOpen(false)}>Shop</Link>
          <Link to="/user/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
          <Link to="/blog" onClick={() => setIsOpen(false)}>Blog</Link>
          <Link to="/about" onClick={() => setIsOpen(false)}>About</Link>
          <Link to="/distributors" onClick={() => setIsOpen(false)}>Distributors</Link>
          {user ? (
            <div className="flex flex-col gap-3">
              <Link to="/user/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <button onClick={() => { logout(); setIsOpen(false); }}>Logout</button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}
