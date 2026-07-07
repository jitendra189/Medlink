import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';

function titleFromPath(pathname: string): { title: string; crumb: string } {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return { title: 'Overview', crumb: '' };
  const [role, section] = segments;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  if (!section) return { title: roleLabel, crumb: '' };
  const nice = section
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: nice, crumb: roleLabel };
}

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function Topbar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const { title, crumb } = titleFromPath(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-surface-200 bg-white/80 px-6 backdrop-blur-md lg:px-8">
      <div>
        {crumb && (
          <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
            {crumb}
          </p>
        )}
        <h1 className="text-lg font-bold tracking-tight text-surface-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-xl border border-surface-200 bg-white p-2.5 text-surface-500 transition hover:bg-surface-50 hover:text-surface-700"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 text-sm font-bold text-white">
          {getInitials(user?.name)}
        </div>
      </div>
    </header>
  );
}
