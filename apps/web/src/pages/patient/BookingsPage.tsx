import { useQuery } from '@tanstack/react-query';
import { bookingsService } from '../../services/bookings.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { Calendar } from 'lucide-react';

export default function PatientBookingsPage() {
  const { data: bookings, isLoading } = useQuery({ queryKey: ['my-bookings'], queryFn: bookingsService.getMy });
  if (isLoading) return <PageSpinner />;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      <div className="space-y-3">
        {bookings?.map((b: any) => (
          <Card key={b.id}><CardContent className="flex items-center gap-4 py-4">
            <Calendar className="h-8 w-8 text-blue-600 bg-blue-50 rounded-lg p-1.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Dr. {b.doctor?.name ?? 'Unknown'}</p>
              <p className="text-sm text-gray-500">{b.hospital?.name} • {b.type}</p>
              <p className="text-xs text-gray-400">{new Date(b.scheduledAt).toLocaleString()}</p>
            </div>
            <Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'danger' : 'warning'}>{b.status}</Badge>
          </CardContent></Card>
        ))}
        {!bookings?.length && <p className="text-gray-500">No bookings yet.</p>}
      </div>
    </div>
  );
}
