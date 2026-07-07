import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bloodService } from '../../services/blood.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { BloodGroup } from '@medlink/shared';
import { User } from 'lucide-react';

export default function BloodPage() {
  const qc = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | ''>('');
  const [units, setUnits] = useState('1');

  const { data: donors, isLoading } = useQuery({ queryKey: ['donors', selectedGroup], queryFn: () => bloodService.searchDonors(selectedGroup ? { bloodGroup: selectedGroup as BloodGroup } : {}) });

  const createRequest = useMutation({
    mutationFn: () => bloodService.createRequest({ bloodGroup: selectedGroup as BloodGroup, unitsRequired: parseInt(units) || 1, urgency: 'high' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blood-requests'] }),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Blood Service</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Search Donors</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            <select className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value as BloodGroup | '')}>
              <option value="">All blood groups</option>
              {Object.values(BloodGroup).map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            {donors?.map((d: any) => (
              <Card key={d.id}><CardContent className="flex items-center gap-3 py-3"><User className="h-8 w-8 text-red-600 bg-red-50 rounded-full p-1.5 flex-shrink-0" /><div><p className="font-medium">{d.user?.name ?? 'Donor'}</p><Badge variant="danger">{d.bloodGroup}</Badge></div></CardContent></Card>
            ))}
            {!donors?.length && <p className="text-gray-500 text-sm">No donors found for selected group.</p>}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Request Blood</h2>
          <div className="space-y-4 p-6 rounded-xl border border-gray-200 bg-white">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group Needed</label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value as BloodGroup | '')}>
                <option value="">Select blood group</option>
                {Object.values(BloodGroup).map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <Input label="Units Required" type="number" min="1" value={units} onChange={(e) => setUnits(e.target.value)} />
            <Button className="w-full" loading={createRequest.isPending} disabled={!selectedGroup} onClick={() => createRequest.mutate()}>Send Blood Request</Button>
            {createRequest.isSuccess && <p className="text-green-600 text-sm text-center">Blood request sent! Nearby donors will be notified.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
