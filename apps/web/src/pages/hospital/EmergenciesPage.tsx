import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emergencyService } from '../../services/emergency.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { EmergencyStatus } from '@medlink/shared';

export default function HospitalEmergenciesPage() {
  const qc = useQueryClient();
  const { data: emergencies, isLoading } = useQuery({ queryKey: ['all-emergencies'], queryFn: emergencyService.getPending });
  const acceptMutation = useMutation({ mutationFn: (id: string) => emergencyService.accept(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['all-emergencies'] }) });
  const rejectMutation = useMutation({ mutationFn: (id: string) => emergencyService.reject(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['all-emergencies'] }) });
  const resolveMutation = useMutation({ mutationFn: (id: string) => emergencyService.resolve(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['all-emergencies'] }) });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Emergency Management</h1>
      <div className="space-y-3">
        {emergencies?.map((e) => (
          <Card key={e.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium capitalize">{e.type} Emergency</p>
                <p className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={e.status === EmergencyStatus.PENDING ? 'warning' : e.status === EmergencyStatus.ACCEPTED ? 'success' : 'default'}>{e.status}</Badge>
                {e.status === EmergencyStatus.PENDING && <>
                  <Button size="sm" onClick={() => acceptMutation.mutate(e.id)}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(e.id)}>Reject</Button>
                </>}
                {e.status === EmergencyStatus.ACCEPTED && <Button size="sm" variant="outline" onClick={() => resolveMutation.mutate(e.id)}>Resolve</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
        {!emergencies?.length && <p className="text-gray-500">No emergencies.</p>}
      </div>
    </div>
  );
}
