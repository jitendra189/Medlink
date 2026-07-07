import { useQuery } from '@tanstack/react-query';
import { ambulanceService } from '../../services/ambulance.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';

export default function DriverRequestsPage() {
  const { data: requests, isLoading } = useQuery({ queryKey: ['driver-requests'], queryFn: ambulanceService.getRequests });
  if (isLoading) return <PageSpinner />;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Emergency Requests</h1>
      <div className="space-y-3">
        {(requests as any[])?.map((r: any) => (
          <Card key={r.id}><CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium capitalize">{r.type} Emergency</p>
              <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</p>
            </div>
            <Button size="sm">Accept</Button>
          </CardContent></Card>
        ))}
        {!requests?.length && <p className="text-gray-500">No requests available.</p>}
      </div>
    </div>
  );
}
