import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ambulanceService } from '../../services/ambulance.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { getSocket } from '../../lib/socket';
import { SOCKET_EVENTS } from '@medlink/shared';
import { MapPin, Power } from 'lucide-react';

export default function DriverDashboardPage() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const { data: requests, isLoading } = useQuery({ queryKey: ['driver-requests'], queryFn: ambulanceService.getRequests });

  const toggleDutyMutation = useMutation({
    mutationFn: ambulanceService.toggleDuty,
    onSuccess: (data: any) => setIsOnDuty(data.isOnDuty),
  });

  useEffect(() => {
    if (isOnDuty) {
      const socket = getSocket();
      locationInterval.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
          ambulanceService.updateLocation(pos.coords.latitude, pos.coords.longitude);
          socket?.emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, { lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
      }, 5000);
    } else {
      if (locationInterval.current) clearInterval(locationInterval.current);
    }
    return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
  }, [isOnDuty]);

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
        <div className="flex items-center gap-3">
          <Badge variant={isOnDuty ? 'success' : 'default'}>{isOnDuty ? 'On Duty' : 'Off Duty'}</Badge>
          <Button variant={isOnDuty ? 'danger' : 'primary'} loading={toggleDutyMutation.isPending} onClick={() => toggleDutyMutation.mutate()}>
            <Power className="h-4 w-4 mr-2" />{isOnDuty ? 'Go Off Duty' : 'Go On Duty'}
          </Button>
        </div>
      </div>
      {isOnDuty && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 py-4">
            <MapPin className="h-5 w-5 text-green-600 animate-pulse" />
            <p className="text-sm text-green-700 font-medium">Location sharing active — updating every 5 seconds</p>
          </CardContent>
        </Card>
      )}
      <h2 className="text-lg font-semibold mb-4">Nearby Emergency Requests</h2>
      <div className="space-y-3">
        {(requests as any[])?.length ? (requests as any[]).map((r: any) => (
          <Card key={r.id}><CardContent className="flex items-center justify-between py-4">
            <div><p className="font-medium capitalize">{r.type} Emergency</p><p className="text-xs text-gray-500">Distance: calculating...</p></div>
            <Button size="sm">Accept Dispatch</Button>
          </CardContent></Card>
        )) : <p className="text-gray-500 text-sm">No emergency requests nearby.</p>}
      </div>
    </div>
  );
}
