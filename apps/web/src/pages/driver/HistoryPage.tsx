import { useQuery } from '@tanstack/react-query';
import { ambulanceService } from '../../services/ambulance.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';

export default function DriverHistoryPage() {
  const { data: requests, isLoading } = useQuery({ queryKey: ['driver-history'], queryFn: ambulanceService.getRequests });
  if (isLoading) return <PageSpinner />;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Trip History</h1>
      <div className="space-y-3">
        {(requests as any[])?.map((r: any) => (
          <Card key={r.id}><CardContent className="flex items-center justify-between py-4">
            <div><p className="font-medium capitalize">{r.type} Emergency</p><p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p></div>
            <Badge variant="info" className="capitalize">{r.status}</Badge>
          </CardContent></Card>
        ))}
        {!requests?.length && <p className="text-gray-500">No trips yet.</p>}
      </div>
    </div>
  );
}
