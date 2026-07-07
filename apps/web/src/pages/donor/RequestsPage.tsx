import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bloodService } from '../../services/blood.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { BloodRequestUrgency } from '@medlink/shared';
import { Droplets } from 'lucide-react';

const urgencyVariant = (u: string) =>
  u === BloodRequestUrgency.CRITICAL ? 'danger'
  : u === BloodRequestUrgency.MEDIUM ? 'warning'
  : 'success';

export default function DonorRequestsPage() {
  const qc = useQueryClient();
  const { data: requests, isLoading } = useQuery({
    queryKey: ['pending-blood-requests'], queryFn: bloodService.getPendingRequests,
  });
  const fulfill = useMutation({
    mutationFn: (id: string) => bloodService.fulfill(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-blood-requests'] }),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Blood Requests</h1>
        <p className="mt-2 text-surface-500">Pending requests matching your blood group.</p>
      </div>

      {!requests?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Droplets className="mb-3 h-10 w-10 text-surface-300" />
            <p className="font-semibold text-surface-800">No pending requests</p>
            <p className="mt-1 text-sm text-surface-500">You'll see requests here when patients need your help.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(requests as any[]).map((r) => (
            <Card key={r.id} interactive>
              <CardContent className="py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                      {r.bloodGroup}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">
                        {r.unitsRequired} unit{r.unitsRequired > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-surface-500">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant={urgencyVariant(r.urgency)} dot>{r.urgency}</Badge>
                </div>
                <Button
                  className="mt-4 w-full"
                  loading={fulfill.isPending}
                  onClick={() => fulfill.mutate(r.id)}
                >
                  Fulfill Request
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
