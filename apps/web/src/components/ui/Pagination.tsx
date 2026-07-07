import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 transition hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages[0] > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-200 bg-white text-sm font-medium text-surface-600 hover:bg-surface-50">1</button>
          {pages[0] > 2 && <span className="px-1 text-surface-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition',
            p === page
              ? 'bg-brand-600 text-white shadow-glow-sm'
              : 'border border-surface-200 bg-white text-surface-600 hover:bg-surface-50'
          )}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-surface-400">…</span>}
          <button onClick={() => onPageChange(totalPages)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-200 bg-white text-sm font-medium text-surface-600 hover:bg-surface-50">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 transition hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
