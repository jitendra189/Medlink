import { useQuery } from '@tanstack/react-query';
import { hospitalsService } from '../../services/hospitals.service';
import { useAuthStore } from '../../stores/auth.store';
import { AvatarUpload } from '../../components/ui/AvatarUpload';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { Building2, MapPin, Phone, Star } from 'lucide-react';

function getInitials(name?: string) {
  if (!name) return 'H';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function HospitalProfilePage() {
  const { user, accessToken, setAuth } = useAuthStore();
  const { data: hospital, isLoading } = useQuery({
    queryKey: ['hospital-dashboard'], queryFn: hospitalsService.getDashboard,
  });

  function handleAvatarUpload(url: string) {
    if (user && accessToken) {
      setAuth({ ...user, avatarUrl: url }, accessToken);
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Hospital Profile</h1>
        <p className="mt-2 text-surface-500">Public information about your hospital.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 md:flex-row md:items-start md:text-left">
          <AvatarUpload
            currentUrl={user?.avatarUrl}
            initials={getInitials(hospital?.name)}
            onUpload={handleAvatarUpload}
            size="lg"
          />
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-surface-900 inline-flex items-center gap-2">
              <Building2 className="h-6 w-6 text-brand-600" />
              {hospital?.name}
            </h2>
            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-surface-500 md:justify-start">
              <MapPin className="h-3.5 w-3.5" />
              {[hospital?.address, hospital?.city, hospital?.state].filter(Boolean).join(', ') || '—'}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <Badge variant="warning">
                <Star className="h-3 w-3 fill-current" /> {hospital?.rating?.toFixed(1) ?? '—'} rating
              </Badge>
              {hospital?.phone && (
                <Badge variant="info">
                  <Phone className="h-3 w-3" /> {hospital.phone}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Hospital details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Hospital name" defaultValue={hospital?.name} />
          <Input label="Phone"         defaultValue={hospital?.phone ?? ''} icon={<Phone className="h-4 w-4" />} />
          <Input label="Address"       defaultValue={hospital?.address ?? ''} />
          <Input label="City"          defaultValue={hospital?.city ?? ''} icon={<MapPin className="h-4 w-4" />} />
          <Input label="State"         defaultValue={hospital?.state ?? ''} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
