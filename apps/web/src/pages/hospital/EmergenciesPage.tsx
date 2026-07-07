import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emergencyService } from '../../services/emergency.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { EmergencyStatus } from '@medlink/shared';
import { cn } from '../../utils/cn';
import { AlertTriangle, MapPin, Clock } from 'lucide-react';

type Filter = 'all' | EmergencyStatus;

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: EmergencyStatus.PENDING,  label: 'Pending' },
  { key: EmergencyStatus.ACCEPTED, label: 'Accepted' },
  { key: EmergencyStatus.RESOLVED, label: 'Resolved' },
  { key: EmergencyStatus.REJECTED, label: 'Rejected' },
];

const statusVariant = (s: EmergencyStatus) =>
  s === EmergencyStatus.PENDING  ? 'pending'
  : s === EmergencyStatus.ACCEPTED ? 'success'
  : s === EmergencyStatus.RESOLVED ? 'info'
  : s === EmergencyStatus.REJECTED ? 'danger'
  : 'default';

function timeAgo(iso: string | Date) {
  const t = new Date(iso).getTime();
  const d = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (d < 60) return `${d}s`;
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  return `${Math.floor(d / 3600)}h`;
}

export default function HospitalEmergenciesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const { data: emergencies, isLoading } = useQuery({
    queryKey: ['all-emergencies'], queryFn: emergencyService.getPending,
  });

  const accept   = useMutation({ mutationFn: (id: string) => emergencyService.accept(id),   onSuccess: () => qc.invalidateQueries({ queryKey: ['all-emergencies'] }) });
  const reject   = useMutation({ mutationFn: (id: string) => emergencyService.reject(id),   onSuccess: () => qc.invalidateQueries({ queryKey: ['all-emergencies'] }) });
  const resolve  = useMutation({ mutationFn: (id: string) => emergencyService.resolve(id),  onSuccess: () => qc.invalidateQueries({ queryKey: ['all-emergencies'] }) });

  const filtered = useMemo(
    () => (emergencies ?? []).filter((e) => filter === 'all' || e.status === filter),
    [emergencies, filter],
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Emergency Management</h1>
        <p className="mt-2 text-surface-500">Accept, reject, and resolve incoming emergencies.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-surface-200 pb-3">
        {filters.map((f) => {
          const active = filter === f.key;
          const count = f.key === 'all'
            ? emergencies?.length ?? 0
            : (emergencies ?? []).filter((e) => e.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
                active ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-surface-600 hover:bg-surface-100',
              )}
            >
              {f.label}
              <span className={cn(
                'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs',
                active ? 'bg-white/20 text-white' : 'bg-surface-200 text-surface-600',
              )}>{count}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <AlertTriangle className="mb-3 h-10 w-10 text-surface-300" />
              <p className="font-semibold text-surface-800">No emergencies to show</p>
              <p className="mt-1 text-sm text-surface-500">Try a different filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id}>
                      <td className="font-medium text-surface-900">{(e as any).patient?.name ?? 'Unknown'}</td>
                      <td className="capitalize">{e.type}</td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-xs text-surface-500">
                          <MapPin className="h-3 w-3" />
                          {e.patientLat.toFixed(3)}, {e.patientLng.toFixed(3)}
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-xs text-surface-500">
                          <Clock className="h-3 w-3" /> {timeAgo(e.createdAt)}
                        </span>
                      </td>
                      <td><Badge variant={statusVariant(e.status)} dot>{e.status}</Badge></td>
                      <td>
                        <div className="flex justify-end gap-2">
                          {e.status === EmergencyStatus.PENDING && (
                            <>
                              <Button size="sm" onClick={() => accept.mutate(e.id)}>Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => reject.mutate(e.id)}>Reject</Button>
                            </>
                          )}
                          {e.status === EmergencyStatus.ACCEPTED && (
                            <Button size="sm" variant="outline" onClick={() => resolve.mutate(e.id)}>Resolve</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
