import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsService } from '../../services/bookings.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { BookingStatus } from '@medlink/shared';
import { Calendar } from 'lucide-react';

const statusVariant = (s: string) =>
  s === BookingStatus.CONFIRMED ? 'success'
  : s === BookingStatus.CANCELLED ? 'danger'
  : s === BookingStatus.COMPLETED ? 'info'
  : 'pending';

export default function HospitalBookingsPage() {
  const qc = useQueryClient();
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['hospital-bookings'], queryFn: bookingsService.getHospital,
  });

  const confirm  = useMutation({ mutationFn: (id: string) => bookingsService.confirm(id),  onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital-bookings'] }) });
  const cancel   = useMutation({ mutationFn: (id: string) => bookingsService.cancel(id),   onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital-bookings'] }) });
  const complete = useMutation({ mutationFn: (id: string) => bookingsService.complete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital-bookings'] }) });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Bookings</h1>
        <p className="mt-2 text-surface-500">Manage appointment requests and doctor schedules.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {!bookings?.length ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Calendar className="mb-3 h-10 w-10 text-surface-300" />
              <p className="font-semibold text-surface-800">No bookings yet</p>
              <p className="mt-1 text-sm text-surface-500">Patient bookings will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Type</th>
                    <th>Scheduled</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(bookings as any[]).map((b) => (
                    <tr key={b.id}>
                      <td className="font-medium text-surface-900">{b.patient?.name ?? 'Unknown'}</td>
                      <td>Dr. {b.doctor?.name ?? '—'}</td>
                      <td className="capitalize">{b.type}</td>
                      <td className="whitespace-nowrap">{new Date(b.scheduledAt).toLocaleString()}</td>
                      <td><Badge variant={statusVariant(b.status)} dot>{b.status}</Badge></td>
                      <td>
                        <div className="flex justify-end gap-2">
                          {b.status === BookingStatus.PENDING && (
                            <Button size="sm" loading={confirm.isPending} onClick={() => confirm.mutate(b.id)}>Confirm</Button>
                          )}
                          {b.status === BookingStatus.CONFIRMED && (
                            <Button size="sm" variant="outline" onClick={() => complete.mutate(b.id)}>Complete</Button>
                          )}
                          {b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.COMPLETED && (
                            <Button size="sm" variant="ghost" onClick={() => cancel.mutate(b.id)}>Cancel</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
