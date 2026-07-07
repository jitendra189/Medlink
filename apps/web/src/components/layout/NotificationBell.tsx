import { useState, useRef, useEffect } from 'react';
import { Bell, X, AlertTriangle, Droplets, Calendar, Info, CheckCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../../services/notifications.service';
import { cn } from '../../utils/cn';

// Map notification type to icon and color
function getNotificationStyle(type: string) {
  switch (type) {
    case 'emergency': return { icon: AlertTriangle, color: 'text-rose-500 bg-rose-50' };
    case 'blood':     return { icon: Droplets,      color: 'text-red-500 bg-red-50' };
    case 'booking':   return { icon: Calendar,      color: 'text-brand-500 bg-brand-50' };
    default:          return { icon: Info,           color: 'text-surface-500 bg-surface-100' };
  }
}

// Convert date to "2m ago", "1h ago", "3d ago"
function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60)   return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getAll,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = (notifications as any[]).filter((n: any) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-xl border border-surface-200 bg-white p-2.5 text-surface-500 transition hover:bg-surface-50 hover:text-surface-700"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-surface-200 bg-white shadow-card-hover animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-surface-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {(notifications as any[]).length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100">
                  <Bell className="h-5 w-5 text-surface-400" />
                </div>
                <p className="text-sm font-medium text-surface-500">No notifications yet</p>
                <p className="text-xs text-surface-400">We'll notify you of emergencies, bookings, and more</p>
              </div>
            ) : (
              <ul className="divide-y divide-surface-50">
                {(notifications as any[]).map((n: any) => {
                  const { icon: Icon, color } = getNotificationStyle(n.type);
                  return (
                    <li
                      key={n.id}
                      onClick={() => { if (!n.isRead) markReadMutation.mutate(n.id); }}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 transition cursor-pointer',
                        n.isRead ? 'hover:bg-surface-50' : 'bg-brand-50/40 hover:bg-brand-50',
                      )}
                    >
                      {/* Icon */}
                      <div className={cn('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full', color)}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm', n.isRead ? 'font-medium text-surface-700' : 'font-semibold text-surface-900')}>
                          {n.title ?? 'Notification'}
                        </p>
                        {n.message && (
                          <p className="mt-0.5 text-xs text-surface-500 line-clamp-2">{n.message}</p>
                        )}
                        <p className="mt-1 text-xs text-surface-400">{timeAgo(n.createdAt)}</p>
                      </div>

                      {/* Unread dot */}
                      {!n.isRead && (
                        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {(notifications as any[]).length > 0 && (
            <div className="border-t border-surface-100 px-4 py-2.5 text-center">
              <p className="text-xs text-surface-400">{(notifications as any[]).length} total notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
