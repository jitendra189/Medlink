import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { hospitalsService } from '../../services/hospitals.service';
import { emergencyService } from '../../services/emergency.service';
import { bookingsService } from '../../services/bookings.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { StatsCard } from '../../components/ui/StatsCard';
import { getSocket } from '../../lib/socket';
import { SOCKET_EVENTS, EmergencyStatus, BookingStatus } from '@medlink/shared';
import { AlertTriangle, BedDouble, Calendar, Stethoscope, MapPin, Clock } from 'lucide-react';

function timeAgo(iso: string | Date) {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function HospitalDashboardPage() {
  const qc = useQueryClient();

  const { data: hospital, isLoading } = useQuery({
    queryKey: ['hospital-dashboard'], queryFn: hospitalsService.getDashboard,
  });
  const { data: emergencies } = useQuery({
    queryKey: ['emergencies'], queryFn: emergencyService.getPending,
  });
  const { data: bookings } = useQuery({
    queryKey: ['hospital-bookings'], queryFn: bookingsService.getHospital,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => qc.invalidateQueries({ queryKey: ['emergencies'] });
    socket.on(SOCKET_EVENTS.EMERGENCY_NEW, handler);
    socket.on(SOCKET_EVENTS.EMERGENCY_UPDATED, handler);
    return () => {
      socket.off(SOCKET_EVENTS.EMERGENCY_NEW, handler);
      socket.off(SOCKET_EVENTS.EMERGENCY_UPDATED, handler);
    };
  }, [qc]);

  const accept = useMutation({
    mutationFn: (id: string) => emergencyService.accept(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emergencies'] }),
  });
  const reject = useMutation({
    mutationFn: (id: string) => emergencyService.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emergencies'] }),
  });

  if (isLoading) return <PageSpinner />;

  const pendingCount = emergencies?.filter((e) => e.status === EmergencyStatus.PENDING).length ?? 0;
  const today = new Date().toDateString();
  const bookingsToday = (bookings as any[] | undefined)?.filter(
    (b) => new Date(b.scheduledAt).toDateString() === today,
  ).length ?? 0;
  const recentBookings = ((bookings as any[]) ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900">{hospital?.name ?? 'Hospital'}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-surface-500">
            <MapPin className="h-3.5 w-3.5" />
            {[hospital?.city, hospital?.state].filter(Boolean).join(', ') || 'Location N/A'}
          </p>
        </div>
        <Badge variant="success" dot>Active</Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={<AlertTriangle className="h-5 w-5" />} accent="rose"    label="Pending Emergencies" value={pendingCount} />
        <StatsCard icon={<BedDouble    className="h-5 w-5" />} accent="emerald" label="ICU Available"       value={hospital?.icuBedsAvailable ?? 0} hint={`of ${hospital?.icuBedsTotal ?? 0} total`} />
        <StatsCard icon={<Calendar     className="h-5 w-5" />} accent="brand"   label="Bookings Today"      value={bookingsToday} />
        <StatsCard icon={<Stethoscope  className="h-5 w-5" />} accent="amber"   label="Total Doctors"       value={hospital?.totalDoctors ?? 0} />
      </div>

      {/* Live emergency queue */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            Live Emergency Queue
          </CardTitle>
          <Badge variant="danger">{pendingCount} pending</Badge>
        </CardHeader>
        <CardContent>
          {!emergencies?.length ? (
            <div className="flex flex-col items-center py-10 text-center">
              <AlertTriangle className="mb-2 h-8 w-8 text-surface-300" />
              <p className="text-sm text-surface-500">No pending emergencies. All clear.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emergencies.map((e) => (
                <div
                  key={e.id}
                  className="animate-slide-up rounded-xl border border-rose-100 bg-rose-50/40 p-4 transition hover:bg-rose-50"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold capitalize text-surface-900">{e.type} Emergency</p>
                        <Badge variant="pending" dot>{e.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-surface-600">
                        Patient: {(e as any).patient?.name ?? 'Unknown'}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-surface-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeAgo(e.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {e.patientLat.toFixed(3)}, {e.patientLng.toFixed(3)}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" loading={accept.isPending} onClick={() => accept.mutate(e.id)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reject.mutate(e.id)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent bookings */}
      <Card>
        <CardHeader><CardTitle>Recent bookings</CardTitle></CardHeader>
        <CardContent>
          {!recentBookings.length ? (
            <div className="py-8 text-center text-sm text-surface-500">No bookings yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Scheduled</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.patient?.name ?? 'Unknown'}</td>
                      <td>Dr. {b.doctor?.name ?? '—'}</td>
                      <td className="whitespace-nowrap">{new Date(b.scheduledAt).toLocaleString()}</td>
                      <td>
                        <Badge
                          variant={b.status === BookingStatus.CONFIRMED ? 'success'
                            : b.status === BookingStatus.CANCELLED ? 'danger'
                            : b.status === BookingStatus.COMPLETED ? 'info' : 'pending'}
                          dot
                        >{b.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
