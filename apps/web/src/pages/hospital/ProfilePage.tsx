import { useQuery } from '@tanstack/react-query';
import { hospitalsService } from '../../services/hospitals.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';

export default function HospitalProfilePage() {
  const { data: hospital, isLoading } = useQuery({ queryKey: ['hospital-dashboard'], queryFn: hospitalsService.getDashboard });
  if (isLoading) return <PageSpinner />;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Hospital Profile</h1>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Hospital Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{hospital?.name}</p></div>
          <div><p className="text-sm text-gray-500">City</p><p className="font-medium">{hospital?.city}</p></div>
          <div><p className="text-sm text-gray-500">State</p><p className="font-medium">{hospital?.state}</p></div>
          <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{hospital?.phone ?? '—'}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
