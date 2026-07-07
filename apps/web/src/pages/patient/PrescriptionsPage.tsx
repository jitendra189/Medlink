import { useQuery } from '@tanstack/react-query';
import { prescriptionsService } from '../../services/prescriptions.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { FileText } from 'lucide-react';

export default function PatientPrescriptionsPage() {
  const { data: prescriptions, isLoading } = useQuery({ queryKey: ['my-prescriptions'], queryFn: prescriptionsService.getMy });
  if (isLoading) return <PageSpinner />;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Prescriptions</h1>
      <div className="space-y-4">
        {prescriptions?.map((p: any) => (
          <Card key={p.id}>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" />Prescription</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-2">Issued: {new Date(p.createdAt).toLocaleDateString()}</p>
              {p.medications?.map((m: any, i: number) => (
                <div key={i} className="py-2 border-b last:border-0">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-gray-500">{m.dosage} — {m.frequency}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        {!prescriptions?.length && <p className="text-gray-500">No prescriptions yet.</p>}
      </div>
    </div>
  );
}
