import { useQuery } from '@tanstack/react-query';
import { bloodService } from '../../services/blood.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { Droplets, History } from 'lucide-react';

const statusVariant = (s: string) =>
  s === 'fulfilled' ? 'success' : s === 'cancelled' ? 'danger' : 'pending';

export default function DonorHistoryPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['my-blood-requests'], queryFn: bloodService.getMyRequests,
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Donation History</h1>
        <p className="mt-2 text-surface-500">Your donation timeline.</p>
      </div>

      {!history?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <History className="mb-3 h-10 w-10 text-surface-300" />
            <p className="font-semibold text-surface-800">No donation history yet</p>
            <p className="mt-1 text-sm text-surface-500">Your first fulfilled request will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-surface-200 pl-6">
          {(history as any[]).map((r) => (
            <li key={r.id} className="relative">
              <span className="absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 ring-4 ring-surface-50">
                <Droplets className="h-3 w-3 text-white" />
              </span>
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold text-surface-900">
                      Blood group <span className="text-rose-600">{r.bloodGroup}</span>
                    </p>
                    <p className="text-xs text-surface-500">
                      {new Date(r.createdAt).toLocaleString()} • {r.unitsRequired} unit{r.unitsRequired > 1 ? 's' : ''}
                    </p>
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
