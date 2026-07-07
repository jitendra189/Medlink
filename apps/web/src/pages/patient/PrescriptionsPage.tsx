import { useQuery } from '@tanstack/react-query';
import { prescriptionsService } from '../../services/prescriptions.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { FileText, Calendar, User } from 'lucide-react';

export default function PatientPrescriptionsPage() {
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['my-prescriptions'],
    queryFn: prescriptionsService.getMy,
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Prescriptions</h1>
        <p className="mt-2 text-surface-500">Your prescription history from all appointments.</p>
      </div>

      {!prescriptions?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-surface-300" />
            <p className="font-semibold text-surface-800">No prescriptions yet</p>
            <p className="mt-1 text-sm text-surface-500">Your prescriptions from doctors will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {prescriptions.map((p: any) => (
            <Card key={p.id} interactive>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  Prescription
                </CardTitle>
                <p className="mt-1 flex items-center gap-4 text-xs text-surface-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  {p.doctor?.name && (
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" /> Dr. {p.doctor.name}
                    </span>
                  )}
                </p>
              </CardHeader>
              <CardContent>
                {p.medications?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {p.medications.map((m: any, i: number) => (
                      <span
                        key={i}
                        className="inline-flex flex-col rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold text-surface-900">{m.name}</span>
                        <span className="text-surface-500">{m.dosage} • {m.frequency}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-surface-500">No medications listed.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
