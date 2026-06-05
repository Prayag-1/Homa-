import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await registerUser(data.name, data.email, data.password);
      toast.success('Registered successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-display font-semibold mb-8 text-center">Register</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input label="Name" name="name" type="text" placeholder="John Doe" error={errors.name?.message} register={register('name')} />
          <Input label="Email" name="email" type="email" placeholder="your@email.com" error={errors.email?.message} register={register('email')} />
          <Input label="Password" name="password" type="password" placeholder="••••••••" error={errors.password?.message} register={register('password')} />
          <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} register={register('confirmPassword')} />
          <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-full">
            Register
          </Button>
        </form>
        <p className="text-center mt-6">
          Already have an account? <a href="/login" className="text-red-500 hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
}
