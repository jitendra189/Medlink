import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { bloodService } from '../../services/blood.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { getSocket } from '../../lib/socket';
import { SOCKET_EVENTS } from '@medlink/shared';

export default function DonorDashboardPage() {
  const qc = useQueryClient();
  const { data: dashboard, isLoading } = useQuery({ queryKey: ['donor-dashboard'], queryFn: bloodService.getDashboard });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on(SOCKET_EVENTS.BLOOD_NEW_REQUEST, () => qc.invalidateQueries({ queryKey: ['donor-dashboard'] }));
    return () => { socket.off(SOCKET_EVENTS.BLOOD_NEW_REQUEST); };
  }, [qc]);

  const toggleMutation = useMutation({ mutationFn: bloodService.toggleAvailability, onSuccess: () => qc.invalidateQueries({ queryKey: ['donor-dashboard'] }) });
  const fulfillMutation = useMutation({ mutationFn: (id: string) => bloodService.fulfill(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['donor-dashboard'] }) });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Donor Dashboard</h1>
        <div className="flex items-center gap-3">
          <Badge variant={(dashboard as any)?.isAvailable ? 'success' : 'danger'}>{(dashboard as any)?.isAvailable ? 'Available' : 'Unavailable'}</Badge>
          <Button variant="outline" size="sm" loading={toggleMutation.isPending} onClick={() => toggleMutation.mutate()}>Toggle Availability</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card><CardHeader><CardTitle className="text-sm text-gray-500">Blood Group</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{(dashboard as any)?.bloodGroup}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-gray-500">Total Donations</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-blue-600">{(dashboard as any)?.totalDonations ?? 0}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-gray-500">Lives Saved</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{(dashboard as any)?.livesSaved ?? 0}</p></CardContent></Card>
      </div>
      <h2 className="text-lg font-semibold mb-4">Pending Blood Requests Matching Your Type</h2>
      <div className="space-y-3">
        {(dashboard as any)?.pendingRequests?.map((r: any) => (
          <Card key={r.id}><CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">Blood Group: <span className="text-red-600">{r.bloodGroup}</span></p>
              <p className="text-xs text-gray-500">Units needed: {r.unitsRequired} • Urgency: <span className="capitalize">{r.urgency}</span></p>
            </div>
            <Button size="sm" loading={fulfillMutation.isPending} onClick={() => fulfillMutation.mutate(r.id)}>Fulfill</Button>
          </CardContent></Card>
        ))}
        {!(dashboard as any)?.pendingRequests?.length && <p className="text-gray-500 text-sm">No pending requests matching your blood group.</p>}
      </div>
    </div>
  );
}
