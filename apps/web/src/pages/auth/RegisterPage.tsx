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
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
  role: z.nativeEnum(Role),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const redirectByRole: Record<Role, string> = {
  [Role.PATIENT]: '/patient/dashboard',
  [Role.HOSPITAL]: '/hospital/dashboard',
  [Role.DONOR]: '/donor/dashboard',
  [Role.DRIVER]: '/driver/dashboard',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: Role.PATIENT },
  });

  const mutation = useMutation({
    mutationFn: authService.register,
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
          <p className="text-gray-500">Create your account</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <Input id="name" label="Full Name" placeholder="Jitendra Singh" error={errors.name?.message} {...register('name')} />
            <Input id="email" label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input id="password" label="Password" type="password" placeholder="Min 8 chars, upper+lower+number" error={errors.password?.message} {...register('password')} />
            <Input id="phone" label="Phone (optional)" placeholder="+919876543210" {...register('phone')} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                {...register('role')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={Role.PATIENT}>Patient</option>
                <option value={Role.HOSPITAL}>Hospital Admin</option>
                <option value={Role.DONOR}>Blood Donor</option>
                <option value={Role.DRIVER}>Ambulance Driver</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
            </div>
            {mutation.error && <p className="text-sm text-red-600 text-center">Registration failed. Email may already be in use.</p>}
            <Button type="submit" className="w-full" loading={mutation.isPending}>Create Account</Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
