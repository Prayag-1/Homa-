import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import './styles/admin.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AnnouncementBar from './components/layout/AnnouncementBar';
import CartDrawer from './components/cart/CartDrawer';
import WhatsAppButton from './components/common/WhatsAppButton';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/admin/AdminRoute';
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Catalog = lazy(() => import('./pages/Catalog'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailure = lazy(() => import('./pages/PaymentFailure'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminBrands = lazy(() => import('./pages/admin/AdminBrands'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminDistributors = lazy(() => import('./pages/admin/AdminDistributors'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminSiteSettings = lazy(() => import('./pages/admin/AdminSiteSettings'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));
const About = lazy(() => import('./pages/About'));
const FAQPage = lazy(() => import('./pages/FAQ'));
const SkinQuizPage = lazy(() => import('./pages/SkinQuiz'));
const ProductAuthenticityPage = lazy(() => import('./pages/ProductAuthenticity'));
const Distributors = lazy(() => import('./pages/Distributors'));
const DistributorMapPage = lazy(() => import('./pages/DistributorMapPage'));
const ContactUsPage = lazy(() => import('./pages/ContactUs'));
const TransformationListPage = lazy(() => import('./pages/transformations/TransformationListPage'));
const TransformationDetailPage = lazy(() => import('./pages/transformations/TransformationDetailPage'));
const TransformationStoriesPage = lazy(() => import('./pages/admin/TransformationStoriesPage'));
const TransformationStoryFormPage = lazy(() => import('./pages/admin/TransformationStoryFormPage'));
const BlogListPage = lazy(() => import('./pages/admin/blogs/BlogListPage'));
const BlogFormPage = lazy(() => import('./pages/admin/blogs/BlogFormPage'));
const UserBlogListPage = lazy(() => import('./pages/blog/BlogListPage'));
const UserBlogDetailPage = lazy(() => import('./pages/blog/BlogDetailPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: 0,
    },
  },
});

const routeFallback = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <div
      style={{
        width: 32,
        height: 32,
        border: '2px solid #E5E7EB',
        borderTop: '2px solid #D10000',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  </div>
);

function AppRoutes() {
  const [cartOpen, setCartOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(72);
  const headerRef = useRef(null);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const hideSiteChrome = isAdminRoute || ['/login', '/register'].includes(location.pathname);

  useEffect(() => {
    if (hideSiteChrome || !headerRef.current) return undefined;

    setHeaderHeight(headerRef.current.getBoundingClientRect().height);

    if (typeof ResizeObserver === 'undefined') return undefined;

    const resizeObserver = new ResizeObserver((entries) => {
      setHeaderHeight(entries[0].contentRect.height);
    });

    resizeObserver.observe(headerRef.current);
    return () => resizeObserver.disconnect();
  }, [hideSiteChrome]);

  useEffect(() => {
    const handleCartOpen = () => setCartOpen(true);
    window.addEventListener('homa:open-cart', handleCartOpen);
    return () => window.removeEventListener('homa:open-cart', handleCartOpen);
  }, []);

  return (
    <>
      {!hideSiteChrome && (
        <>
          <div ref={headerRef} className="fixed left-0 right-0 top-0 z-50 w-full">
            <AnnouncementBar />
            <Navbar onCartOpen={() => setCartOpen(true)} />
          </div>
          <div style={{ height: headerHeight }} aria-hidden="true" />
        </>
      )}
      <main>
        <Suspense fallback={routeFallback}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/user/dashboard" element={<Dashboard />} />
            <Route path="/account" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/shop" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
            <Route path="/products/:id" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
            <Route path="/blog" element={<ErrorBoundary><UserBlogListPage /></ErrorBoundary>} />
            <Route path="/blog/:slug" element={<ErrorBoundary><UserBlogDetailPage /></ErrorBoundary>} />
            <Route path="/about" element={<ErrorBoundary><About /></ErrorBoundary>} />
            <Route path="/faq" element={<ErrorBoundary><FAQPage /></ErrorBoundary>} />
            <Route path="/skin-quiz" element={<ErrorBoundary><SkinQuizPage /></ErrorBoundary>} />
            <Route path="/quiz" element={<ErrorBoundary><SkinQuizPage /></ErrorBoundary>} />
            <Route path="/authenticity" element={<ErrorBoundary><ProductAuthenticityPage /></ErrorBoundary>} />
            <Route path="/distributors" element={<ErrorBoundary><Distributors /></ErrorBoundary>} />
            <Route path="/distributors/:id/map" element={<ErrorBoundary><DistributorMapPage /></ErrorBoundary>} />
            <Route path="/contact" element={<ErrorBoundary><ContactUsPage /></ErrorBoundary>} />
            <Route path="/transformations" element={<ErrorBoundary><TransformationListPage /></ErrorBoundary>} />
            <Route path="/transformations/:slug" element={<ErrorBoundary><TransformationDetailPage /></ErrorBoundary>} />
            <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
            <Route path="/payment-failure" element={<ProtectedRoute><PaymentFailure /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><Navigate to="/admin/products" replace /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/brands" element={<AdminRoute><AdminBrands /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
            <Route path="/admin/distributors" element={<AdminRoute><AdminDistributors /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
            <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
            <Route path="/admin/banners" element={<AdminRoute><AdminBanners /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSiteSettings /></AdminRoute>} />
            <Route path="/admin/transformations" element={<AdminRoute><TransformationStoriesPage /></AdminRoute>} />
            <Route path="/admin/transformations/new" element={<AdminRoute><TransformationStoryFormPage /></AdminRoute>} />
            <Route path="/admin/transformations/:id/edit" element={<AdminRoute><TransformationStoryFormPage /></AdminRoute>} />
            <Route path="/admin/products/new" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
            <Route path="/admin/products/:id/edit" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
            <Route path="/admin/blogs" element={<AdminRoute><BlogListPage /></AdminRoute>} />
            <Route path="/admin/blogs/new" element={<AdminRoute><BlogFormPage /></AdminRoute>} />
            <Route path="/admin/blogs/:id/edit" element={<AdminRoute><BlogFormPage /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!hideSiteChrome && <Footer />}
      {!hideSiteChrome && <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />}
      <WhatsAppButton />
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
