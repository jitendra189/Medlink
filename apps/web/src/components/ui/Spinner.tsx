import { cn } from '../../utils/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600', className)} />
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner className="h-12 w-12" />
    </div>
  );
}
