import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bloodService } from '../../services/blood.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';

export default function DonorRequestsPage() {
  const qc = useQueryClient();
  const { data: requests, isLoading } = useQuery({ queryKey: ['pending-blood-requests'], queryFn: bloodService.getPendingRequests });
  const fulfillMutation = useMutation({ mutationFn: (id: string) => bloodService.fulfill(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-blood-requests'] }) });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Blood Requests</h1>
      <div className="space-y-3">
        {(requests as any[])?.map((r: any) => (
          <Card key={r.id}><CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">Blood Group: <span className="text-red-600">{r.bloodGroup}</span></p>
              <p className="text-sm text-gray-500">Units: {r.unitsRequired} • Urgency: <span className="capitalize">{r.urgency}</span></p>
              <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
            </div>
            <Button size="sm" loading={fulfillMutation.isPending} onClick={() => fulfillMutation.mutate(r.id)}>Fulfill Request</Button>
          </CardContent></Card>
        ))}
        {!requests?.length && <p className="text-gray-500">No pending requests matching your blood group.</p>}
      </div>
    </div>
  );
}
