import { useQuery } from '@tanstack/react-query';
import { ambulanceService } from '../../services/ambulance.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { Ambulance, MapPin, Clock } from 'lucide-react';

export default function DriverRequestsPage() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['driver-requests'], queryFn: ambulanceService.getRequests,
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Emergency Requests</h1>
        <p className="mt-2 text-surface-500">All open dispatches available to accept.</p>
      </div>

      {!(requests as any[])?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Ambulance className="mb-3 h-10 w-10 text-surface-300" />
            <p className="font-semibold text-surface-800">No requests available</p>
            <p className="mt-1 text-sm text-surface-500">Try going on duty to see incoming dispatches.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(requests as any[]).map((r) => (
            <Card key={r.id} interactive>
              <CardContent className="py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                      <Ambulance className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold capitalize text-surface-900">{r.type} Emergency</p>
                      <p className="flex items-center gap-1 text-xs text-surface-500">
                        <Clock className="h-3 w-3" /> {new Date(r.createdAt).toLocaleString()}
                      </p>
                      {typeof r.patientLat === 'number' && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-surface-500">
                          <MapPin className="h-3 w-3" /> {r.patientLat.toFixed(3)}, {r.patientLng.toFixed(3)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="pending" dot>{r.status}</Badge>
                </div>
                <Button className="mt-4 w-full">Accept Dispatch</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
