import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/admin.css';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const redirectTo = location.state?.from?.pathname || '/admin/products';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const data = await login(values.email, values.password);
      const user = data.data?.user;

      if (user?.role !== 'admin') {
        await logout();
        toast.error('Access denied. This portal is for administrators only.');
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login flex min-h-screen items-center justify-center px-4">
      <div className="admin-card w-full max-w-[420px] p-7">
        <div className="mb-7 text-center">
          <div className="text-3xl font-black tracking-[0.2em]">HOMA</div>
          <div className="mt-2 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--admin-muted)' }}>
            Admin Portal
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.08em]" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              className="admin-input"
              type="email"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-[var(--admin-error)]">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.08em]" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              className="admin-input"
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-xs text-[var(--admin-error)]">{errors.password.message}</p>}
          </div>

          <button className="admin-button admin-button-primary h-10 w-full" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
