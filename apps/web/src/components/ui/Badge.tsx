import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'pending' | 'brand';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
  danger:  'bg-rose-500/10  text-rose-600  ring-rose-500/20',
  info:    'bg-brand-500/10 text-brand-600 ring-brand-500/20',
  default: 'bg-surface-100  text-surface-600 ring-surface-200',
  pending: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
  brand:   'bg-brand-600 text-white ring-brand-500/30',
};

const dotClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-rose-500',
  info:    'bg-brand-500',
  default: 'bg-surface-400',
  pending: 'bg-amber-500',
  brand:   'bg-white',
};

export function Badge({ className, variant = 'default', dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[variant])} />}
      {children}
    </span>
  );
}
