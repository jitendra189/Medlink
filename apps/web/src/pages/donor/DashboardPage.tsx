import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { bloodService } from '../../services/blood.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { StatsCard } from '../../components/ui/StatsCard';
import { getSocket } from '../../lib/socket';
import { SOCKET_EVENTS } from '@medlink/shared';
import { cn } from '../../utils/cn';
import { Droplets, HeartPulse, Award, AlertTriangle } from 'lucide-react';

export default function DonorDashboardPage() {
  const qc = useQueryClient();
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['donor-dashboard'], queryFn: bloodService.getDashboard,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => qc.invalidateQueries({ queryKey: ['donor-dashboard'] });
    socket.on(SOCKET_EVENTS.BLOOD_NEW_REQUEST, handler);
    return () => { socket.off(SOCKET_EVENTS.BLOOD_NEW_REQUEST, handler); };
  }, [qc]);

  const toggleAvailability = useMutation({
    mutationFn: bloodService.toggleAvailability,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['donor-dashboard'] }),
  });
  const fulfill = useMutation({
    mutationFn: (id: string) => bloodService.fulfill(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['donor-dashboard'] }),
  });

  if (isLoading) return <PageSpinner />;

  const d = dashboard as any;
  const isAvailable = !!d?.isAvailable;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500 text-lg font-bold text-white shadow-glow-sm">
            {d?.bloodGroup ?? '?'}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-surface-900">Donor Dashboard</h1>
            <p className="mt-1 text-sm text-surface-500">Your donation impact and pending requests.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatsCard icon={<Droplets  className="h-5 w-5" />} accent="rose"    label="Total donations" value={d?.totalDonations ?? 0} />
        <StatsCard icon={<HeartPulse className="h-5 w-5" />} accent="emerald" label="Lives saved"     value={d?.livesSaved ?? 0} />
        <StatsCard icon={<Award     className="h-5 w-5" />} accent="brand"   label="Blood group"     value={d?.bloodGroup ?? '—'} />
      </div>

      {/* Availability toggle */}
      <Card className={cn(isAvailable && 'ring-2 ring-emerald-500/30')}>
        <CardContent className="flex flex-col items-center gap-4 py-8 md:flex-row md:justify-between md:text-left">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <span className={cn(
                'inline-block h-3 w-3 rounded-full',
                isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-surface-300',
              )} />
              <h2 className="text-xl font-bold text-surface-900">
                {isAvailable ? 'You are available to donate' : 'You are currently unavailable'}
              </h2>
            </div>
            <p className="mt-1 text-sm text-surface-500">
              {isAvailable
                ? 'Nearby patients can request blood from you right now.'
                : 'Enable to start receiving matching blood requests.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleAvailability.mutate()}
            disabled={toggleAvailability.isPending}
            className={cn(
              'relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500',
              isAvailable ? 'border-emerald-500 bg-emerald-500' : 'border-surface-300 bg-surface-200',
            )}
            aria-pressed={isAvailable}
            aria-label="Toggle availability"
          >
            <span
              className={cn(
                'inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform',
                isAvailable ? 'translate-x-7' : 'translate-x-0',
              )}
            />
          </button>
        </CardContent>
      </Card>

      {/* Pending requests */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" /> Pending requests matching your group
          </CardTitle>
          <Badge variant="danger">{d?.pendingRequests?.length ?? 0}</Badge>
        </CardHeader>
        <CardContent>
          {!d?.pendingRequests?.length ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Droplets className="mb-2 h-8 w-8 text-surface-300" />
              <p className="text-sm text-surface-500">No pending requests right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {d.pendingRequests.map((r: any) => (
                <div key={r.id} className="animate-slide-up rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                        {r.bloodGroup}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-surface-900">
                          {r.unitsRequired} unit{r.unitsRequired > 1 ? 's' : ''} needed
                        </p>
                        <p className="text-xs text-surface-500 capitalize">Urgency: {r.urgency}</p>
                      </div>
                    </div>
                    <Button size="sm" loading={fulfill.isPending} onClick={() => fulfill.mutate(r.id)}>
                      Fulfill Request
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
