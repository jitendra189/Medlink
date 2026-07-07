import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsService } from '../../services/bookings.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';

export default function HospitalBookingsPage() {
  const qc = useQueryClient();
  const { data: bookings, isLoading } = useQuery({ queryKey: ['hospital-bookings'], queryFn: bookingsService.getHospital });
  const confirmMutation = useMutation({ mutationFn: (id: string) => bookingsService.confirm(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital-bookings'] }) });
  const cancelMutation = useMutation({ mutationFn: (id: string) => bookingsService.cancel(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital-bookings'] }) });
  const completeMutation = useMutation({ mutationFn: (id: string) => bookingsService.complete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital-bookings'] }) });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Bookings Management</h1>
      <div className="space-y-3">
        {(bookings as any[])?.map((b: any) => (
          <Card key={b.id}><CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">Dr. {b.doctor?.name}</p>
              <p className="text-sm text-gray-500">Patient: {b.patient?.name} • {new Date(b.scheduledAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'danger' : 'warning'}>{b.status}</Badge>
              {b.status === 'pending' && <Button size="sm" onClick={() => confirmMutation.mutate(b.id)}>Confirm</Button>}
              {b.status === 'confirmed' && <Button size="sm" variant="outline" onClick={() => completeMutation.mutate(b.id)}>Complete</Button>}
              {b.status !== 'cancelled' && b.status !== 'completed' && <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(b.id)}>Cancel</Button>}
            </div>
          </CardContent></Card>
        ))}
        {!bookings?.length && <p className="text-gray-500">No bookings.</p>}
      </div>
    </div>
  );
}
