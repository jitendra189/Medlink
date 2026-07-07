import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ambulanceService } from '../../services/ambulance.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { getSocket } from '../../lib/socket';
import { SOCKET_EVENTS } from '@medlink/shared';
import { cn } from '../../utils/cn';
import { MapPin, Power, Ambulance, Clock } from 'lucide-react';

function timeAgo(iso: string | Date) {
  const t = new Date(iso).getTime();
  const d = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
}

export default function DriverDashboardPage() {
  const qc = useQueryClient();
  const [isOnDuty, setIsOnDuty] = useState(false);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['driver-requests'], queryFn: ambulanceService.getRequests,
  });

  const toggleDuty = useMutation({
    mutationFn: ambulanceService.toggleDuty,
    onSuccess: (data: any) => setIsOnDuty(!!data?.isOnDuty),
  });

  useEffect(() => {
    if (isOnDuty) {
      const socket = getSocket();
      locationInterval.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
          ambulanceService.updateLocation(pos.coords.latitude, pos.coords.longitude);
          socket?.emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        });
      }, 5000);
    } else if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [isOnDuty]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => qc.invalidateQueries({ queryKey: ['driver-requests'] });
    socket.on(SOCKET_EVENTS.EMERGENCY_NEW, handler);
    return () => { socket.off(SOCKET_EVENTS.EMERGENCY_NEW, handler); };
  }, [qc]);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      {/* Duty banner */}
      <div
        className={cn(
          'flex flex-col items-center justify-between gap-4 rounded-2xl p-6 text-white shadow-card md:flex-row',
          isOnDuty
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
            : 'bg-gradient-to-r from-surface-500 to-surface-600',
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Power className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{isOnDuty ? 'On Duty' : 'Off Duty'}</p>
            <p className="text-sm text-white/80">
              {isOnDuty
                ? 'You are visible to dispatchers and can be assigned emergencies.'
                : 'Turn on duty to start receiving dispatches.'}
            </p>
          </div>
        </div>
        <Button
          size="lg"
          variant={isOnDuty ? 'danger' : 'primary'}
          loading={toggleDuty.isPending}
          onClick={() => toggleDuty.mutate()}
          className={cn(!isOnDuty && 'bg-white text-emerald-600 hover:bg-surface-100 shadow-none')}
        >
          {isOnDuty ? 'Go Off Duty' : 'Go On Duty'}
        </Button>
      </div>

      {isOnDuty && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="flex items-center gap-3 py-4">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <MapPin className="h-4 w-4 text-emerald-700" />
            <p className="text-sm font-medium text-emerald-800">
              Location sharing active — updating every 5 seconds
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="section-title mb-4">Nearby emergency requests</h2>
        {!(requests as any[])?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Ambulance className="mb-2 h-8 w-8 text-surface-300" />
              <p className="text-sm text-surface-500">No emergency requests available right now.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {(requests as any[]).map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                      <Ambulance className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold capitalize text-surface-900">{r.type} Emergency</p>
                      <p className="flex items-center gap-1 text-xs text-surface-500">
                        <Clock className="h-3 w-3" /> {timeAgo(r.createdAt)}
                        {typeof r.patientLat === 'number' && (
                          <>
                            <span>•</span>
                            <MapPin className="h-3 w-3" /> {r.patientLat.toFixed(3)}, {r.patientLng.toFixed(3)}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="pending" dot>{r.status}</Badge>
                    <Button size="sm">Accept Dispatch</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
