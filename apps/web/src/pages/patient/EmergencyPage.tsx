import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emergencyService } from '../../services/emergency.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmergencyType, EmergencyStatus, SOCKET_EVENTS } from '@medlink/shared';
import { getSocket } from '../../lib/socket';
import { AlertTriangle } from 'lucide-react';

const statusVariant = (s: EmergencyStatus): 'warning' | 'success' | 'danger' | 'default' | 'info' =>
  ({ pending: 'warning' as const, accepted: 'success' as const, rejected: 'danger' as const, cancelled: 'default' as const, resolved: 'info' as const })[s] ?? 'default';

export default function PatientEmergencyPage() {
  const qc = useQueryClient();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
    const socket = getSocket();
    if (!socket) return;
    socket.on(SOCKET_EVENTS.EMERGENCY_UPDATED, () => qc.invalidateQueries({ queryKey: ['my-emergencies'] }));
    return () => { socket.off(SOCKET_EVENTS.EMERGENCY_UPDATED); };
  }, [qc]);

  const { data: requests } = useQuery({ queryKey: ['my-emergencies'], queryFn: emergencyService.getMy });

  const sosMutation = useMutation({
    mutationFn: () => emergencyService.create({ type: EmergencyType.AMBULANCE, patientLat: location!.lat, patientLng: location!.lng }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-emergencies'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => emergencyService.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-emergencies'] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Emergency</h1>
      <div className="mb-8 border border-red-200 bg-red-50 rounded-xl">
        <div className="flex flex-col items-center py-10 gap-4">
          <AlertTriangle className="h-16 w-16 text-red-500" />
          <h2 className="text-xl font-bold text-red-700">Emergency SOS</h2>
          <p className="text-red-600 text-sm text-center">Sends your GPS location to nearby hospitals and dispatches an ambulance.</p>
          <Button variant="danger" size="lg" loading={sosMutation.isPending} disabled={!location} onClick={() => sosMutation.mutate()}>
            {location ? 'Send SOS Alert' : 'Getting location...'}
          </Button>
        </div>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">My Emergency Requests</h2>
      <div className="space-y-3">
        {requests?.map((r) => (
          <Card key={r.id}><CardContent className="flex items-center justify-between py-4">
            <div><p className="font-medium capitalize">{r.type} Emergency</p><p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</p></div>
            <div className="flex items-center gap-3">
              <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
              {r.status === EmergencyStatus.PENDING && <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(r.id)}>Cancel</Button>}
            </div>
          </CardContent></Card>
        ))}
        {!requests?.length && <p className="text-gray-500 text-sm">No emergency requests yet.</p>}
      </div>
    </div>
  );
}
