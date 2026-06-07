import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Navbar />
              <Routes>
                <Route path="/"          element={<Home />} />
                <Route path="/user/dashboard" element={<Dashboard />} />
                <Route path="/login"     element={<Login />} />
                <Route path="/register"  element={<Register />} />
                <Route path="*"          element={<NotFound />} />
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
