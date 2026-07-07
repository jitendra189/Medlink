import { useAuthStore } from '../../stores/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bloodService } from '../../services/blood.service';
import { AvatarUpload } from '../../components/ui/AvatarUpload';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { Mail, Phone, User } from 'lucide-react';

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function DonorProfilePage() {
  const { user, accessToken, setAuth } = useAuthStore();
  const qc = useQueryClient();
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['donor-dashboard'], queryFn: bloodService.getDashboard,
  });
  const toggleAvailability = useMutation({
    mutationFn: bloodService.toggleAvailability,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['donor-dashboard'] }),
  });

  function handleAvatarUpload(url: string) {
    if (user && accessToken) {
      setAuth({ ...user, avatarUrl: url }, accessToken);
    }
  }

  if (isLoading) return <PageSpinner />;
  const d = dashboard as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Profile</h1>
        <p className="mt-2 text-surface-500">Your donor details and availability.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center md:flex-row md:text-left">
          <AvatarUpload
            currentUrl={user?.avatarUrl}
            initials={getInitials(user?.name)}
            onUpload={handleAvatarUpload}
            size="lg"
            gradient="from-rose-500 to-emerald-500"
          />
          <div className="flex-1">
            <div className="flex flex-col items-center gap-2 md:flex-row md:items-center">
              <h2 className="text-2xl font-bold text-surface-900">{user?.name}</h2>
              <span className="inline-flex h-8 w-14 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                {d?.bloodGroup ?? '—'}
              </span>
            </div>
            <p className="text-sm text-surface-500">{user?.email}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <Badge variant={d?.isAvailable ? 'success' : 'default'} dot>
                {d?.isAvailable ? 'Available' : 'Unavailable'}
              </Badge>
              <Button size="sm" variant="outline" loading={toggleAvailability.isPending} onClick={() => toggleAvailability.mutate()}>
                Toggle availability
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Personal information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Full name"   defaultValue={user?.name}     icon={<User className="h-4 w-4" />} />
          <Input label="Email"       defaultValue={user?.email}    icon={<Mail className="h-4 w-4" />} readOnly />
          <Input label="Phone"       defaultValue={user?.phone ?? ''} icon={<Phone className="h-4 w-4" />} />
          <Input label="Blood group" defaultValue={d?.bloodGroup ?? ''} readOnly />
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
