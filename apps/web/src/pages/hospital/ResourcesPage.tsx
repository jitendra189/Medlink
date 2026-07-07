import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalsService } from '../../services/hospitals.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { BedDouble, Ambulance } from 'lucide-react';
import { cn } from '../../utils/cn';

function Gauge({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((value / total) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-surface-700">{label}</span>
        <span className="font-semibold text-surface-500">{value}/{total} ({pct}%)</span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-100">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function HospitalResourcesPage() {
  const qc = useQueryClient();
  const { data: hospital, isLoading } = useQuery({
    queryKey: ['hospital-dashboard'], queryFn: hospitalsService.getDashboard,
  });

  const [icuTotal, setIcuTotal] = useState('');
  const [icuAvailable, setIcuAvailable] = useState('');
  const [ambTotal, setAmbTotal] = useState('');
  const [ambulances, setAmbulances] = useState('');

  useEffect(() => {
    if (!hospital) return;
    setIcuTotal(String(hospital.icuBedsTotal ?? 0));
    setIcuAvailable(String(hospital.icuBedsAvailable ?? 0));
    setAmbTotal(String(hospital.ambulancesTotal ?? 0));
    setAmbulances(String(hospital.ambulancesAvailable ?? 0));
  }, [hospital]);

  const update = useMutation({
    mutationFn: () => hospitalsService.updateResources({
      icuBedsTotal:        icuTotal     ? parseInt(icuTotal)     : undefined,
      icuBedsAvailable:    icuAvailable ? parseInt(icuAvailable) : undefined,
      ambulancesTotal:     ambTotal     ? parseInt(ambTotal)     : undefined,
      ambulancesAvailable: ambulances   ? parseInt(ambulances)   : undefined,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital-dashboard'] }),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Resources</h1>
        <p className="mt-2 text-surface-500">Update your hospital's live resource availability.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-brand-600" /> Current utilisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Gauge
              label="ICU beds"
              value={hospital?.icuBedsAvailable ?? 0}
              total={hospital?.icuBedsTotal ?? 0}
              color="bg-emerald-500"
            />
            <Gauge
              label="Ambulances"
              value={hospital?.ambulancesAvailable ?? 0}
              total={hospital?.ambulancesTotal ?? 0}
              color="bg-amber-500"
            />
            <div className="flex gap-2">
              <Badge variant="success" dot>ICU: {hospital?.icuBedsAvailable ?? 0} free</Badge>
              <Badge variant="warning" dot>Ambulances: {hospital?.ambulancesAvailable ?? 0} free</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ambulance className="h-5 w-5 text-amber-500" /> Update resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="ICU beds total"     type="number" min="0" value={icuTotal}     onChange={(e) => setIcuTotal(e.target.value)} />
              <Input label="ICU beds available" type="number" min="0" value={icuAvailable} onChange={(e) => setIcuAvailable(e.target.value)} />
              <Input label="Ambulances total"     type="number" min="0" value={ambTotal}    onChange={(e) => setAmbTotal(e.target.value)} />
              <Input label="Ambulances available" type="number" min="0" value={ambulances}  onChange={(e) => setAmbulances(e.target.value)} />
            </div>
            <Button className="w-full" size="lg" loading={update.isPending} onClick={() => update.mutate()}>
              Save changes
            </Button>
            {update.isSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                Resources updated successfully.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
