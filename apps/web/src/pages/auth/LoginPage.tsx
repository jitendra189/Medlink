import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Role } from '@medlink/shared';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

const redirectByRole: Record<Role, string> = {
  [Role.PATIENT]: '/patient/dashboard',
  [Role.HOSPITAL]: '/hospital/dashboard',
  [Role.DONOR]: '/donor/dashboard',
  [Role.DRIVER]: '/driver/dashboard',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      navigate(redirectByRole[data.user.role]);
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">MedLink</h1>
          <p className="text-gray-500">Sign in to your account</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <Input id="email" label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input id="password" label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            {mutation.error && (
              <p className="text-sm text-red-600 text-center">Invalid email or password</p>
            )}
            <Button type="submit" className="w-full" loading={mutation.isPending}>Sign In</Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
