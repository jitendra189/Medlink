import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bloodService } from '../../services/blood.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { BloodGroup, BloodRequestUrgency } from '@medlink/shared';
import { cn } from '../../utils/cn';
import { Droplets, MapPin, Users } from 'lucide-react';

const groups = Object.values(BloodGroup);

export default function BloodPage() {
  const qc = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | ''>('');
  const [units, setUnits] = useState('1');
  const [urgency, setUrgency] = useState<BloodRequestUrgency>(BloodRequestUrgency.MEDIUM);

  const { data: donors, isLoading } = useQuery({
    queryKey: ['donors', selectedGroup],
    queryFn: () => bloodService.searchDonors(selectedGroup ? { bloodGroup: selectedGroup as BloodGroup } : {}),
  });

  const createRequest = useMutation({
    mutationFn: () =>
      bloodService.createRequest({
        bloodGroup: selectedGroup as BloodGroup,
        unitsRequired: parseInt(units) || 1,
        urgency,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blood-requests'] }),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Blood Service</h1>
        <p className="mt-2 text-surface-500">Find donors by blood group or send an urgent request.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Search donors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" /> Search Donors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-surface-700">Filter by blood group</p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGroup('')}
                  className={cn(
                    'rounded-xl border-2 px-3 py-2 text-sm font-bold transition',
                    selectedGroup === ''
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-surface-200 text-surface-600 hover:border-surface-300',
                  )}
                >
                  All
                </button>
                {groups.map((g) => {
                  const active = selectedGroup === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGroup(g)}
                      className={cn(
                        'rounded-xl border-2 px-3 py-2 text-sm font-bold transition',
                        active
                          ? 'border-rose-500 bg-rose-500 text-white shadow-glow-sm'
                          : 'border-surface-200 text-surface-700 hover:border-rose-300',
                      )}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              {!donors?.length ? (
                <div className="py-8 text-center">
                  <Droplets className="mx-auto mb-2 h-8 w-8 text-surface-300" />
                  <p className="text-sm text-surface-500">No donors found for this group.</p>
                </div>
              ) : (
                donors.map((d: any) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl border border-surface-100 bg-surface-50 p-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                      {d.bloodGroup}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-surface-900">{d.user?.name ?? 'Donor'}</p>
                      <p className="flex items-center gap-1 text-xs text-surface-500">
                        <MapPin className="h-3 w-3" />
                        {d.user?.city ?? d.city ?? 'City N/A'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        d.isAvailable ? 'bg-emerald-500' : 'bg-surface-300',
                      )}
                      title={d.isAvailable ? 'Available' : 'Unavailable'}
                    />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create request */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-rose-500" /> Request Blood
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-surface-700">Blood group needed</label>
              <div className="grid grid-cols-4 gap-2">
                {groups.map((g) => {
                  const active = selectedGroup === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGroup(g)}
                      className={cn(
                        'rounded-xl border-2 py-2 text-sm font-bold transition',
                        active
                          ? 'border-rose-500 bg-rose-500 text-white'
                          : 'border-surface-200 text-surface-700 hover:border-rose-300',
                      )}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Units required"
              type="number"
              min="1"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-surface-700">Urgency</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: BloodRequestUrgency.LOW,     l: 'Low',    color: 'emerald' },
                  { v: BloodRequestUrgency.MEDIUM,  l: 'Medium', color: 'amber' },
                  { v: BloodRequestUrgency.CRITICAL,l: 'High',   color: 'rose' },
                ].map(({ v, l, color }) => {
                  const active = urgency === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setUrgency(v)}
                      className={cn(
                        'rounded-xl border-2 py-2 text-sm font-semibold transition',
                        active
                          ? color === 'rose' ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : color === 'amber' ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-surface-200 text-surface-600 hover:border-surface-300',
                      )}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              variant="danger"
              loading={createRequest.isPending}
              disabled={!selectedGroup}
              onClick={() => createRequest.mutate()}
            >
              Send Blood Request
            </Button>

            {createRequest.isSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <Badge variant="success" dot>Sent</Badge> Nearby donors have been notified.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
