import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const redirectTo = location.state?.from?.pathname || '/user/dashboard';

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form.identifier, form.password);
      toast.success('Logged in successfully');
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,#f7e9de_0%,#f5f0ea_45%,#fdfaf7_100%)]">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white/85 p-8 shadow-[0_24px_80px_rgba(26,20,16,0.12)] backdrop-blur">
        <p className="mb-2 text-sm uppercase tracking-[0.35em] text-black/45">Welcome back</p>
        <h1 className="font-display text-5xl font-semibold">Login</h1>
        <p className="mt-3 text-sm text-black/65">Use your email or phone number to sign in.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <Input
            label="Email or phone"
            name="identifier"
            value={form.identifier}
            onChange={onChange}
            placeholder="name@email.com or +9779812345678"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Your password"
          />
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Login
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-black/70">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-black underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
