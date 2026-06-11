import { useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import './styles/admin.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/admin/AdminRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/admin/AdminLogin';
import AdminBrands from './pages/admin/AdminBrands';
import AdminCategories from './pages/admin/AdminCategories';
import AdminDistributors from './pages/admin/AdminDistributors';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCustomers from './pages/admin/AdminCustomers';
import About from './pages/About';
import Distributors from './pages/Distributors';
import TransformationListPage from './pages/transformations/TransformationListPage';
import TransformationDetailPage from './pages/transformations/TransformationDetailPage';
import TransformationStoriesPage from './pages/admin/TransformationStoriesPage';
import TransformationStoryFormPage from './pages/admin/TransformationStoryFormPage';
import ContactUsPage from './pages/ContactUs';
import BlogListPage from './pages/admin/blogs/BlogListPage';
import BlogFormPage from './pages/admin/blogs/BlogFormPage';
import UserBlogListPage from './pages/blog/BlogListPage';
import UserBlogDetailPage from './pages/blog/BlogDetailPage';

const queryClient = new QueryClient();

function AppRoutes() {
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar onCartOpen={() => setCartOpen(true)} />}
      {!isAdminRoute && <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />}
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
          path="/blog"
          element={(
            <ErrorBoundary>
              <UserBlogListPage />
            </ErrorBoundary>
          )}
        />
        <Route
          path="/blog/:slug"
          element={(
            <ErrorBoundary>
              <UserBlogDetailPage />
            </ErrorBoundary>
          )}
        />
        <Route
          path="/about"
          element={(
            <ErrorBoundary>
              <About />
            </ErrorBoundary>
          )}
        />
        <Route
          path="/distributors"
          element={(
            <ErrorBoundary>
              <Distributors />
            </ErrorBoundary>
          )}
        />
        <Route
          path="/contact"
          element={(
            <ErrorBoundary>
              <ContactUsPage />
            </ErrorBoundary>
          )}
        />
        <Route
          path="/transformations"
          element={(
            <ErrorBoundary>
              <TransformationListPage />
            </ErrorBoundary>
          )}
        />
        <Route
          path="/transformations/:slug"
          element={(
            <ErrorBoundary>
              <TransformationDetailPage />
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
        <Route
          path="/checkout"
          element={(
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/payment-success"
          element={(
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/payment-failure"
          element={(
            <ProtectedRoute>
              <PaymentFailure />
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={(
            <AdminRoute>
              <Navigate to="/admin/products" replace />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/products"
          element={(
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/brands"
          element={(
            <AdminRoute>
              <AdminBrands />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/categories"
          element={(
            <AdminRoute>
              <AdminCategories />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/customers"
          element={(
            <AdminRoute>
              <AdminCustomers />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/distributors"
          element={(
            <AdminRoute>
              <AdminDistributors />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/transformations"
          element={(
            <AdminRoute>
              <TransformationStoriesPage />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/transformations/new"
          element={(
            <AdminRoute>
              <TransformationStoryFormPage />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/transformations/:id/edit"
          element={(
            <AdminRoute>
              <TransformationStoryFormPage />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/products/new"
          element={(
            <AdminRoute>
              <AdminProductForm />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/products/:id/edit"
          element={(
            <AdminRoute>
              <AdminProductForm />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/blogs"
          element={(
            <AdminRoute>
              <BlogListPage />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/blogs/new"
          element={(
            <AdminRoute>
              <BlogFormPage />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/blogs/:id/edit"
          element={(
            <AdminRoute>
              <BlogFormPage />
            </AdminRoute>
          )}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdminRoute && <Footer />}
      <Toaster position="top-right" />
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
