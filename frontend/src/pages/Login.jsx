import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import HomaLogo from '../components/common/HomaLogo';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

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
    if (loading) return;
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Please check your login details');
      return;
    }
    setLoading(true);
    try {
      await login(parsed.data.identifier, parsed.data.password);
      toast.success('Logged in successfully');
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message =
        error.response?.status === 429
          ? 'Too many login attempts. Please wait a few minutes and try again.'
          : error.response?.data?.message || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-homa-cream md:flex-row">
      <aside className="sakura-pattern flex h-[180px] flex-col items-center justify-center bg-homa-red px-6 py-8 text-center text-white md:h-auto md:flex-[0.45]">
        <HomaLogo variant="white" size="lg" />
        <p className="mt-6 max-w-sm font-accent text-2xl italic leading-snug text-white">
          Your journey to beautiful skin starts here.
        </p>
        <p className="mt-4 font-body text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 md:mt-10">
          Japanese Health & Beauty Store
        </p>
      </aside>

      <section className="flex flex-1 items-center justify-center md:flex-[0.55] md:px-12 md:py-12">
        <div className="w-full max-w-md bg-white p-6 md:m-8 md:rounded-3xl md:p-12 md:shadow-[0_24px_80px_rgba(209,0,0,0.12)]">
          <h1 className="font-heading text-3xl font-semibold text-homa-black">Welcome Back</h1>
          <p className="mt-3 font-body text-sm text-homa-grey">Use your email or phone number to sign in.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <Input
              label="Email or phone"
              name="identifier"
              value={form.identifier}
              onChange={onChange}
              placeholder="Email address or phone number"
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

          <p className="mt-6 text-center font-body text-sm text-homa-grey">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-homa-red hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
