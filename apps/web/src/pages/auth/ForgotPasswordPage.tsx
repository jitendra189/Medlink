import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { HeartPulse, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({ mutationFn: (d: FormData) => authService.forgotPassword(d.email) });

  return (
    <div className="flex min-h-screen">
      {/* Left panel - dark branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-navy-950 p-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">MedLink</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug">
            Forgot your password?<br />
            <span className="text-gradient">No problem.</span>
          </h2>
          <p className="mt-4 text-surface-400">
            Enter your registered email and we&apos;ll send you a secure link to reset your password.
          </p>
        </div>
        <p className="text-xs text-surface-600">© {new Date().getFullYear()} MedLink. All rights reserved.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-surface-500 hover:text-surface-900 transition">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>

          {mutation.isSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
              <h2 className="text-xl font-bold text-surface-900">Check your email</h2>
              <p className="mt-2 text-sm text-surface-500">
                If that email is registered, you&apos;ll receive a password reset link shortly.
                <br /><span className="text-xs text-surface-400 mt-1 block">(For this demo, check the API server console for the reset link)</span>
              </p>
              <Link to="/login" className="mt-6 inline-block">
                <Button variant="secondary">Back to Login</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-surface-900">Reset your password</h1>
                <p className="mt-2 text-sm text-surface-500">Enter your email to receive a reset link.</p>
              </div>
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
                <Input
                  id="email"
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                {mutation.isError && (
                  <p className="text-sm text-rose-600">Something went wrong. Please try again.</p>
                )}
                <Button type="submit" className="w-full" loading={mutation.isPending}>
                  <Mail className="h-4 w-4" /> Send Reset Link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
