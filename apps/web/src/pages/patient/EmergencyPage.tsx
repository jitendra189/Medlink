import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emergencyService } from '../../services/emergency.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmergencyType, EmergencyStatus, SOCKET_EVENTS } from '@medlink/shared';
import { getSocket } from '../../lib/socket';
import { AlertTriangle, MapPin, Ambulance, HeartPulse, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

const statusVariant = (s: EmergencyStatus) =>
  ({
    [EmergencyStatus.PENDING]:   'pending',
    [EmergencyStatus.ACCEPTED]:  'success',
    [EmergencyStatus.REJECTED]:  'danger',
    [EmergencyStatus.CANCELLED]: 'default',
    [EmergencyStatus.RESOLVED]:  'info',
  } as const)[s] ?? 'default';

const typeOptions = [
  { v: EmergencyType.GENERAL,   l: 'Medical',   icon: HeartPulse },
  { v: EmergencyType.ICU,       l: 'ICU',       icon: Activity },
  { v: EmergencyType.AMBULANCE, l: 'Ambulance', icon: Ambulance },
];

export default function PatientEmergencyPage() {
  const qc = useQueryClient();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [type, setType] = useState<EmergencyType>(EmergencyType.AMBULANCE);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setLocError(err.message),
    );
    const socket = getSocket();
    if (!socket) return;
    const handler = () => qc.invalidateQueries({ queryKey: ['my-emergencies'] });
    socket.on(SOCKET_EVENTS.EMERGENCY_UPDATED, handler);
    return () => { socket.off(SOCKET_EVENTS.EMERGENCY_UPDATED, handler); };
  }, [qc]);

  const { data: requests } = useQuery({ queryKey: ['my-emergencies'], queryFn: emergencyService.getMy });

  const sosMutation = useMutation({
    mutationFn: () => emergencyService.create({
      type,
      patientLat: location!.lat,
      patientLng: location!.lng,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-emergencies'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => emergencyService.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-emergencies'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Emergency</h1>
        <p className="mt-2 text-surface-500">One tap sends your location to nearby hospitals and drivers.</p>
      </div>

      {/* SOS card */}
      <Card className="relative overflow-hidden border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-rose-50">
        <CardContent className="flex flex-col items-center gap-6 py-14 text-center">
          <div className="relative">
            <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" />
            <span className="absolute inset-0 animate-pulse-slow rounded-full bg-rose-500/20 blur-2xl" />
            <button
              type="button"
              disabled={!location || sosMutation.isPending}
              onClick={() => sosMutation.mutate()}
              className={cn(
                'relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-glow transition-all',
                'hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed',
              )}
              aria-label="Send SOS"
            >
              <div className="text-center">
                <AlertTriangle className="mx-auto h-10 w-10" />
                <p className="mt-1 text-lg font-bold tracking-wider">SOS</p>
              </div>
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold text-rose-700">Send Emergency Alert</h2>
            <p className="mt-1 text-sm text-rose-600">
              Sends your GPS location to nearby hospitals and ambulance drivers.
            </p>
          </div>

          {/* GPS status */}
          <div className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
            location ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700',
          )}>
            <MapPin className="h-3.5 w-3.5" />
            {location
              ? `GPS locked — ${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`
              : locError
                ? `Location unavailable: ${locError}`
                : 'Acquiring location…'}
          </div>

          {/* Emergency type */}
          <div className="grid w-full max-w-md grid-cols-3 gap-2">
            {typeOptions.map(({ v, l, icon: Icon }) => {
              const active = type === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setType(v)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-semibold transition',
                    active
                      ? 'border-rose-500 bg-rose-500 text-white'
                      : 'border-surface-200 bg-white text-surface-700 hover:border-rose-300',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {l}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active emergencies */}
      <div>
        <h2 className="section-title mb-4">My active emergencies</h2>
        {!requests?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <AlertTriangle className="mb-2 h-8 w-8 text-surface-300" />
              <p className="text-sm text-surface-500">No emergency requests yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold capitalize text-surface-900">{r.type} Emergency</p>
                      <p className="text-xs text-surface-500">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariant(r.status)} dot>{r.status}</Badge>
                    {r.status === EmergencyStatus.PENDING && (
                      <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(r.id)}>
                        Cancel
                      </Button>
                    )}
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
