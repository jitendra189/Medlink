import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalsService } from '../../services/hospitals.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';

export default function HospitalResourcesPage() {
  const qc = useQueryClient();
  const { data: hospital, isLoading } = useQuery({ queryKey: ['hospital-dashboard'], queryFn: hospitalsService.getDashboard });
  const [icuTotal, setIcuTotal] = useState('');
  const [icuAvailable, setIcuAvailable] = useState('');
  const [ambulances, setAmbulances] = useState('');

  const updateMutation = useMutation({
    mutationFn: () => hospitalsService.updateResources({
      icuBedsTotal: icuTotal ? parseInt(icuTotal) : undefined,
      icuBedsAvailable: icuAvailable ? parseInt(icuAvailable) : undefined,
      ambulancesAvailable: ambulances ? parseInt(ambulances) : undefined,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital-dashboard'] }),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Resources</h1>
      <p className="text-gray-500 mb-6">Current: ICU {hospital?.icuBedsAvailable}/{hospital?.icuBedsTotal} • Ambulances {hospital?.ambulancesAvailable}</p>
      <div className="max-w-md space-y-4 p-6 rounded-xl border border-gray-200 bg-white">
        <Input label="ICU Beds Total" type="number" placeholder={String(hospital?.icuBedsTotal ?? 0)} value={icuTotal} onChange={(e) => setIcuTotal(e.target.value)} />
        <Input label="ICU Beds Available" type="number" placeholder={String(hospital?.icuBedsAvailable ?? 0)} value={icuAvailable} onChange={(e) => setIcuAvailable(e.target.value)} />
        <Input label="Ambulances Available" type="number" placeholder={String(hospital?.ambulancesAvailable ?? 0)} value={ambulances} onChange={(e) => setAmbulances(e.target.value)} />
        <Button className="w-full" loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>Update Resources</Button>
        {updateMutation.isSuccess && <p className="text-green-600 text-sm text-center">Resources updated successfully.</p>}
      </div>
    </div>
  );
}
