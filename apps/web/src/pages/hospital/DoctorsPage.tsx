import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalsService } from '../../services/hospitals.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { api } from '../../lib/axios';
import { Stethoscope, Plus } from 'lucide-react';

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function HospitalDoctorsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [spec, setSpec] = useState('');
  const [phone, setPhone] = useState('');

  const { data: hospital } = useQuery({ queryKey: ['hospital-dashboard'], queryFn: hospitalsService.getDashboard });
  const { data: doctors, isLoading } = useQuery({
    queryKey: ['hospital-doctors-manage', hospital?.id],
    queryFn: () => hospitalsService.getDoctors(hospital!.id),
    enabled: !!hospital?.id,
  });

  const addDoctor = useMutation({
    mutationFn: () =>
      api.post('/doctors', { name, specialization: spec, phone, hospitalId: hospital?.id }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospital-doctors-manage'] });
      setName(''); setSpec(''); setPhone(''); setModal(false);
    },
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900">Doctors</h1>
          <p className="mt-2 text-surface-500">Manage your hospital's doctor roster.</p>
        </div>
        <Button onClick={() => setModal(true)}>
          <Plus className="h-4 w-4" /> Add Doctor
        </Button>
      </div>

      {!doctors?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Stethoscope className="mb-3 h-10 w-10 text-surface-300" />
            <p className="font-semibold text-surface-800">No doctors added yet</p>
            <p className="mt-1 text-sm text-surface-500">Start building your roster.</p>
            <Button className="mt-4" onClick={() => setModal(true)}>
              <Plus className="h-4 w-4" /> Add your first doctor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(doctors as any[]).map((d) => (
            <Card key={d.id} interactive>
              <CardContent className="flex items-center gap-3 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 text-sm font-bold text-white">
                  {getInitials(d.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-surface-900">Dr. {d.name}</p>
                  <p className="truncate text-xs text-surface-500">{d.speciality ?? d.specialization ?? 'General'}</p>
                </div>
                <Badge variant={d.isAvailable ? 'success' : 'default'} dot>
                  {d.isAvailable ? 'Available' : 'Busy'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Add a doctor"
        description="They'll appear immediately in your roster and be available for bookings."
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={addDoctor.isPending} disabled={!name || !spec} onClick={() => addDoctor.mutate()}>
              Add doctor
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Doctor name"    placeholder="Priya Sharma"   value={name}  onChange={(e) => setName(e.target.value)} />
          <Input label="Specialization" placeholder="Cardiology"     value={spec}  onChange={(e) => setSpec(e.target.value)} />
          <Input label="Phone (optional)" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
