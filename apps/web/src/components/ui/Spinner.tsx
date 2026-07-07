import { cn } from '../../utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-[3px]',
  } as const;
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-brand-500 border-t-transparent',
        sizes[size],
        className,
      )}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-slow rounded-full bg-brand-500/20 blur-2xl" />
          <Spinner size="lg" />
        </div>
        <p className="text-sm font-medium text-surface-500">Loading…</p>
      </div>
    </div>
  );
}

export function InlineLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-surface-500">
      <Spinner size="sm" />
      <span>{label}</span>
    </div>
  );
}
