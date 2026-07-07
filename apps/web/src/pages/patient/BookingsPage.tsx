import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsService } from '../../services/bookings.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { BookingStatus } from '@medlink/shared';
import { cn } from '../../utils/cn';
import { Calendar, Stethoscope, Building2 } from 'lucide-react';

type Filter = 'all' | BookingStatus;

const filters: { key: Filter; label: string }[] = [
  { key: 'all',                       label: 'All' },
  { key: BookingStatus.PENDING,       label: 'Pending' },
  { key: BookingStatus.CONFIRMED,     label: 'Confirmed' },
  { key: BookingStatus.COMPLETED,     label: 'Completed' },
  { key: BookingStatus.CANCELLED,     label: 'Cancelled' },
];

const statusVariant = (s: string) =>
  s === BookingStatus.CONFIRMED ? 'success'
  : s === BookingStatus.COMPLETED ? 'info'
  : s === BookingStatus.CANCELLED ? 'danger'
  : 'pending';

export default function PatientBookingsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings'], queryFn: bookingsService.getMy,
  });

  const cancel = useMutation({
    mutationFn: (id: string) => bookingsService.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] }),
  });

  const filtered = useMemo(
    () => (bookings ?? []).filter((b: any) => filter === 'all' || b.status === filter),
    [bookings, filter],
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">My Bookings</h1>
        <p className="mt-2 text-surface-500">Track and manage your appointments.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-surface-200 pb-3">
        {filters.map((f) => {
          const count = f.key === 'all'
            ? bookings?.length ?? 0
            : (bookings ?? []).filter((b: any) => b.status === f.key).length;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
                active
                  ? 'bg-brand-600 text-white shadow-glow-sm'
                  : 'text-surface-600 hover:bg-surface-100',
              )}
            >
              {f.label}
              <span className={cn(
                'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs',
                active ? 'bg-white/20 text-white' : 'bg-surface-200 text-surface-600',
              )}>{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Calendar className="mb-3 h-10 w-10 text-surface-300" />
            <p className="font-semibold text-surface-800">No bookings here</p>
            <p className="mt-1 text-sm text-surface-500">Try a different filter or book a new appointment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b: any) => (
            <Card key={b.id}>
              <CardContent className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-900">Dr. {b.doctor?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-surface-500">
                    {b.doctor?.speciality ?? b.doctor?.specialization ?? 'General'}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-surface-500">
                    <Building2 className="h-3 w-3" /> {b.hospital?.name ?? '—'}
                    <span>•</span>
                    <Calendar className="h-3 w-3" /> {new Date(b.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(b.status)} dot>{b.status}</Badge>
                  {b.status === BookingStatus.PENDING && (
                    <Button size="sm" variant="outline" onClick={() => cancel.mutate(b.id)} loading={cancel.isPending}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
