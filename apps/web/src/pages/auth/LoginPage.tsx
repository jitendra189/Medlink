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
import { HeartPulse, Mail, Lock, Quote } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

const redirectByRole: Record<Role, string> = {
  [Role.PATIENT]:  '/patient/dashboard',
  [Role.HOSPITAL]: '/hospital/dashboard',
  [Role.DONOR]:    '/donor/dashboard',
  [Role.DRIVER]:   '/driver/dashboard',
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
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* LEFT: dark branding */}
      <div className="relative hidden overflow-hidden bg-hero-gradient lg:block">
        <div className="pointer-events-none absolute -left-20 top-32 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-10 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-glow-sm">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">MedLink</span>
          </Link>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Connecting lives in <span className="text-gradient">critical moments</span>
            </h2>
            <p className="mt-4 text-surface-300">
              Sign in to coordinate emergencies, ICU beds, blood donors, and ambulances in real time.
            </p>
          </div>

          <div className="glass-dark max-w-md rounded-2xl p-6">
            <Quote className="h-6 w-6 text-brand-400" />
            <p className="mt-3 text-sm text-surface-200">
              &ldquo;MedLink cut our emergency response time in half. A patient reached ICU in under 8
              minutes — something unthinkable before.&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 text-sm font-bold">
                AK
              </div>
              <div>
                <p className="text-sm font-semibold">Dr. Anjali Kapoor</p>
                <p className="text-xs text-surface-400">Chief of Emergency, Apollo Hospitals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: login form */}
      <div className="flex items-center justify-center bg-surface-50 p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-glow-sm">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-surface-900">MedLink</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-surface-900">Welcome back</h1>
          <p className="mt-2 text-surface-500">Sign in to your MedLink account to continue.</p>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="mt-8 space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-surface-600">
                <input type="checkbox" className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500" />
                Remember me
              </label>
              <button type="button" className="font-medium text-brand-600 hover:underline">
                Forgot password?
              </button>
            </div>

            {mutation.error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Invalid email or password. Please try again.
              </div>
            )}

            <Button type="submit" className="w-full" loading={mutation.isPending} size="lg">
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-surface-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
