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
import { HeartPulse, Mail, Lock, User, Phone, Building2, Droplets, Ambulance } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useMemo } from 'react';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include upper, lower, and number'),
  role: z.nativeEnum(Role),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const redirectByRole: Record<Role, string> = {
  [Role.PATIENT]:  '/patient/dashboard',
  [Role.HOSPITAL]: '/hospital/dashboard',
  [Role.DONOR]:    '/donor/dashboard',
  [Role.DRIVER]:   '/driver/dashboard',
};

const roleOptions: { value: Role; icon: typeof User; title: string; desc: string }[] = [
  { value: Role.PATIENT,  icon: User,       title: 'Patient',   desc: 'Book care & trigger SOS' },
  { value: Role.HOSPITAL, icon: Building2,  title: 'Hospital',  desc: 'Manage resources' },
  { value: Role.DONOR,    icon: Droplets,   title: 'Donor',     desc: 'Save lives with blood' },
  { value: Role.DRIVER,   icon: Ambulance,  title: 'Driver',    desc: 'Respond to dispatches' },
];

function scorePassword(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  const label = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][score] ?? 'Too weak';
  const color = ['bg-rose-500', 'bg-rose-500', 'bg-amber-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'][score] ?? 'bg-rose-500';
  return { score, label, color };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: Role.PATIENT },
  });

  const selectedRole = watch('role');
  const password = watch('password') ?? '';
  const strength = useMemo(() => scorePassword(password), [password]);

  const mutation = useMutation({
    mutationFn: authService.register,
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
              Join the network that <span className="text-gradient">saves lives</span>
            </h2>
            <p className="mt-4 text-surface-300">
              Whether you're a patient, provider, donor, or driver — get set up in under a minute.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: '500+', l: 'Hospitals' },
              { v: '10K+', l: 'Donors' },
              { v: '< 4 min', l: 'Response' },
              { v: '120+', l: 'Cities' },
            ].map((s) => (
              <div key={s.l} className="glass-dark rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{s.v}</p>
                <p className="text-xs text-surface-400">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: form */}
      <div className="flex items-center justify-center bg-surface-50 p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-glow-sm">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-surface-900">MedLink</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-surface-900">Create your account</h1>
          <p className="mt-2 text-surface-500">Get set up in less than a minute.</p>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="mt-8 space-y-4">
            <Input
              id="name"
              label="Full name"
              placeholder="Jitendra Singh"
              icon={<User className="h-4 w-4" />}
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <div>
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="Min 8 chars, upper, lower, number"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          i < strength.score ? strength.color : 'bg-surface-200',
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs font-medium text-surface-500">{strength.label}</p>
                </div>
              )}
            </div>
            <Input
              id="phone"
              label="Phone (optional)"
              placeholder="+91 98765 43210"
              icon={<Phone className="h-4 w-4" />}
              {...register('phone')}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-surface-700">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map(({ value, icon: Icon, title, desc }) => {
                  const active = selectedRole === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('role', value, { shouldValidate: true })}
                      className={cn(
                        'flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all',
                        active
                          ? 'border-brand-600 bg-brand-50 shadow-glow-sm'
                          : 'border-surface-200 bg-white hover:border-surface-300',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          active ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className={cn('mt-1 text-sm font-semibold', active ? 'text-brand-700' : 'text-surface-900')}>
                        {title}
                      </p>
                      <p className="text-xs text-surface-500">{desc}</p>
                    </button>
                  );
                })}
              </div>
              {errors.role && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.role.message}</p>}
            </div>

            {mutation.error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Registration failed. This email may already be in use.
              </div>
            )}

            <Button type="submit" className="w-full" loading={mutation.isPending} size="lg">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
