import { useQuery } from '@tanstack/react-query';
import { ambulanceService } from '../../services/ambulance.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { History, Ambulance } from 'lucide-react';
import { EmergencyStatus } from '@medlink/shared';

const statusVariant = (s: string) =>
  s === EmergencyStatus.RESOLVED ? 'info'
  : s === EmergencyStatus.ACCEPTED ? 'success'
  : s === EmergencyStatus.REJECTED ? 'danger'
  : s === EmergencyStatus.CANCELLED ? 'default'
  : 'pending';

export default function DriverHistoryPage() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['driver-history'], queryFn: ambulanceService.getRequests,
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Trip History</h1>
        <p className="mt-2 text-surface-500">All past dispatches you've responded to.</p>
      </div>

      {!(requests as any[])?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <History className="mb-3 h-10 w-10 text-surface-300" />
            <p className="font-semibold text-surface-800">No trips yet</p>
            <p className="mt-1 text-sm text-surface-500">Accept your first dispatch to start building your history.</p>
          </CardContent>
        </Card>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-surface-200 pl-6">
          {(requests as any[]).map((r) => (
            <li key={r.id} className="relative">
              <span className="absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 ring-4 ring-surface-50">
                <Ambulance className="h-3 w-3 text-white" />
              </span>
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold capitalize text-surface-900">{r.type} Emergency</p>
                    <p className="text-xs text-surface-500">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge variant={statusVariant(r.status)} dot>{r.status}</Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
