import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { hospitalsService } from '../../services/hospitals.service';
import { emergencyService } from '../../services/emergency.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { getSocket } from '../../lib/socket';
import { SOCKET_EVENTS } from '@medlink/shared';

export default function HospitalDashboardPage() {
  const qc = useQueryClient();
  const { data: hospital, isLoading } = useQuery({ queryKey: ['hospital-dashboard'], queryFn: hospitalsService.getDashboard });
  const { data: emergencies } = useQuery({ queryKey: ['emergencies'], queryFn: emergencyService.getPending });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on(SOCKET_EVENTS.EMERGENCY_NEW, () => qc.invalidateQueries({ queryKey: ['emergencies'] }));
    return () => { socket.off(SOCKET_EVENTS.EMERGENCY_NEW); };
  }, [qc]);

  const acceptMutation = useMutation({ mutationFn: (id: string) => emergencyService.accept(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['emergencies'] }) });
  const rejectMutation = useMutation({ mutationFn: (id: string) => emergencyService.reject(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['emergencies'] }) });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{hospital?.name ?? 'Hospital Dashboard'}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'ICU Available', value: hospital?.icuBedsAvailable ?? 0, color: 'text-green-600' },
          { label: 'ICU Total', value: hospital?.icuBedsTotal ?? 0, color: 'text-blue-600' },
          { label: 'Ambulances', value: hospital?.ambulancesAvailable ?? 0, color: 'text-orange-600' },
          { label: 'Doctors', value: hospital?.totalDoctors ?? 0, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardHeader><CardTitle className="text-sm text-gray-500">{label}</CardTitle></CardHeader><CardContent><p className={`text-3xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>
      <h2 className="text-lg font-semibold mb-4">Pending Emergency Requests ({emergencies?.length ?? 0})</h2>
      <div className="space-y-3">
        {emergencies?.map((e) => (
          <Card key={e.id} className="border-red-100">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium capitalize">{e.type} Emergency</p>
                <p className="text-xs text-gray-500">Patient: {(e as any).patient?.name} • {new Date(e.createdAt).toLocaleString()}</p>
                <p className="text-xs text-gray-400">Location: {e.patientLat.toFixed(4)}, {e.patientLng.toFixed(4)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" loading={acceptMutation.isPending} onClick={() => acceptMutation.mutate(e.id)}>Accept</Button>
                <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(e.id)}>Reject</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!emergencies?.length && <p className="text-gray-500 text-sm">No pending emergencies.</p>}
      </div>
    </div>
  );
}
