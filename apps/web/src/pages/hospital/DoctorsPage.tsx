import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalsService } from '../../services/hospitals.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { api } from '../../lib/axios';
import { User } from 'lucide-react';

export default function HospitalDoctorsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [spec, setSpec] = useState('');

  const { data: hospital } = useQuery({ queryKey: ['hospital-dashboard'], queryFn: hospitalsService.getDashboard });
  const { data: doctors, isLoading } = useQuery({
    queryKey: ['hospital-doctors-manage', hospital?.id],
    queryFn: () => hospitalsService.getDoctors(hospital!.id),
    enabled: !!hospital?.id,
  });

  const addDoctor = useMutation({
    mutationFn: () => api.post('/doctors', { name, specialization: spec, hospitalId: hospital?.id }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hospital-doctors-manage'] }); setName(''); setSpec(''); },
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Doctors</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Doctor List</h2>
          <div className="space-y-3">
            {(doctors as any[])?.map((d: any) => (
              <Card key={d.id}><CardContent className="flex items-center gap-3 py-3">
                <User className="h-8 w-8 text-blue-600 bg-blue-50 rounded-full p-1.5" />
                <div className="flex-1"><p className="font-medium">{d.name}</p><p className="text-sm text-gray-500">{d.specialization}</p></div>
                <Badge variant={d.isAvailable ? 'success' : 'default'}>{d.isAvailable ? 'Available' : 'Busy'}</Badge>
              </CardContent></Card>
            ))}
            {!doctors?.length && <p className="text-gray-500 text-sm">No doctors added yet.</p>}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Add Doctor</h2>
          <div className="space-y-4 p-6 rounded-xl border border-gray-200 bg-white">
            <Input label="Doctor Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Priya Sharma" />
            <Input label="Specialization" value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="Cardiology" />
            <Button className="w-full" loading={addDoctor.isPending} disabled={!name || !spec} onClick={() => addDoctor.mutate()}>Add Doctor</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
