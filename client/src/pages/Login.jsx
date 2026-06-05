import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-display font-semibold mb-8 text-center">Login</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input label="Email" name="email" type="email" placeholder="your@email.com" error={errors.email?.message} register={register('email')} />
          <Input label="Password" name="password" type="password" placeholder="••••••••" error={errors.password?.message} register={register('password')} />
          <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-full">
            Login
          </Button>
        </form>
        <p className="text-center mt-6">
          Don't have an account? <a href="/register" className="text-red-500 hover:underline">Register</a>
        </p>
      </div>
    </div>
  );
}
