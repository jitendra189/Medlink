import { useAuthStore } from '../../stores/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bloodService } from '../../services/blood.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';

export default function DonorProfilePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { data: dashboard, isLoading } = useQuery({ queryKey: ['donor-dashboard'], queryFn: bloodService.getDashboard });
  const toggleMutation = useMutation({ mutationFn: bloodService.toggleAvailability, onSuccess: () => qc.invalidateQueries({ queryKey: ['donor-dashboard'] }) });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Donor Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{user?.name}</p></div>
          <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{user?.email}</p></div>
          <div><p className="text-sm text-gray-500">Blood Group</p><p className="font-medium text-red-600">{(dashboard as any)?.bloodGroup}</p></div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Availability</p><Badge variant={(dashboard as any)?.isAvailable ? 'success' : 'danger'}>{(dashboard as any)?.isAvailable ? 'Available' : 'Unavailable'}</Badge></div>
            <Button variant="outline" size="sm" loading={toggleMutation.isPending} onClick={() => toggleMutation.mutate()}>Toggle</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
