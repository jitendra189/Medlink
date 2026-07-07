import { useQuery } from '@tanstack/react-query';
import { bloodService } from '../../services/blood.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';

export default function DonorHistoryPage() {
  const { data: history, isLoading } = useQuery({ queryKey: ['my-blood-requests'], queryFn: bloodService.getMyRequests });
  if (isLoading) return <PageSpinner />;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Donation History</h1>
      <div className="space-y-3">
        {(history as any[])?.map((r: any) => (
          <Card key={r.id}><CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">Blood Group: <span className="text-red-600">{r.bloodGroup}</span></p>
              <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
            </div>
            <Badge variant={r.status === 'fulfilled' ? 'success' : 'default'}>{r.status}</Badge>
          </CardContent></Card>
        ))}
        {!history?.length && <p className="text-gray-500">No donation history yet.</p>}
      </div>
    </div>
  );
}
