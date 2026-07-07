import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, rightSlot, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-surface-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 transition-all duration-200 focus:outline-none focus:ring-2',
              icon && 'pl-10',
              rightSlot && 'pr-10',
              error
                ? 'border-rose-400 focus:border-transparent focus:ring-rose-500'
                : 'border-surface-200 focus:border-transparent focus:ring-brand-500',
              className,
            )}
            aria-invalid={!!error || undefined}
            {...props}
          />
          {rightSlot && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400">
              {rightSlot}
            </span>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-surface-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
