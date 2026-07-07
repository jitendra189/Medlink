import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface StatsCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  trend?: { direction: 'up' | 'down'; value: string };
  accent?: 'brand' | 'emerald' | 'rose' | 'amber';
  className?: string;
}

const accentBg: Record<NonNullable<StatsCardProps['accent']>, string> = {
  brand:   'bg-brand-500/10 text-brand-600',
  emerald: 'bg-emerald-500/10 text-emerald-600',
  rose:    'bg-rose-500/10 text-rose-600',
  amber:   'bg-amber-500/10 text-amber-600',
};

export function StatsCard({ icon, label, value, hint, trend, accent = 'brand', className }: StatsCardProps) {
  const trendUp = trend?.direction === 'up';
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        {icon && (
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', accentBg[accent])}>
            {icon}
          </div>
        )}
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600',
            )}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {trendUp ? <path d="m6 15 6-6 6 6" /> : <path d="m6 9 6 6 6-6" />}
            </svg>
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-surface-500">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-surface-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-surface-400">{hint}</p>}
      </div>
    </div>
  );
}
