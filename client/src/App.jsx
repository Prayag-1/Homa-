import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Navbar onCartOpen={() => setCartOpen(true)} />
              <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/user/dashboard" element={<Dashboard />} />
                <Route
                  path="/shop"
                  element={(
                    <ErrorBoundary>
                      <Catalog />
                    </ErrorBoundary>
                  )}
                />
                <Route
                  path="/products/:id"
                  element={(
                    <ErrorBoundary>
                      <ProductDetail />
                    </ErrorBoundary>
                  )}
                />
                <Route
                  path="/wishlist"
                  element={(
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  )}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
              <Toaster position="top-right" />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
