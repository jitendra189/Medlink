import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { HeartPulse, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

const schema = z.object({
  newPassword: z.string()
    .min(8, 'At least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (d: FormData) => authService.resetPassword(token, d.newPassword),
    onSuccess: () => setTimeout(() => navigate('/login'), 3000),
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-card max-w-md">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
          <h2 className="text-xl font-bold text-surface-900">Invalid reset link</h2>
          <p className="mt-2 text-sm text-surface-500">This link is invalid or has expired.</p>
          <Link to="/forgot-password" className="mt-6 inline-block">
            <Button>Request new link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-navy-950 p-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">MedLink</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug">
            Choose a strong<br /><span className="text-gradient">new password.</span>
          </h2>
          <p className="mt-4 text-surface-400">Your new password must be at least 8 characters with uppercase, lowercase, and a number.</p>
        </div>
        <p className="text-xs text-surface-600">© {new Date().getFullYear()} MedLink. All rights reserved.</p>
      </div>

      <div className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {mutation.isSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
              <h2 className="text-xl font-bold text-surface-900">Password reset!</h2>
              <p className="mt-2 text-sm text-surface-500">Your password has been updated. Redirecting to login...</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-surface-900">Set new password</h1>
                <p className="mt-2 text-sm text-surface-500">Enter your new password below.</p>
              </div>
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
                <Input id="newPassword" label="New Password" type="password" placeholder="Min 8 chars" error={errors.newPassword?.message} {...register('newPassword')} />
                <Input id="confirmPassword" label="Confirm Password" type="password" placeholder="Repeat password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
                {mutation.isError && <p className="text-sm text-rose-600">Invalid or expired token. Please request a new reset link.</p>}
                <Button type="submit" className="w-full" loading={mutation.isPending}>
                  <Lock className="h-4 w-4" /> Reset Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
