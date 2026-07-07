import { useAuthStore } from '../../stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Mail, Phone, User, Truck } from 'lucide-react';

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function DriverProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Driver Profile</h1>
        <p className="mt-2 text-surface-500">Manage your driver details.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center md:flex-row md:text-left">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-emerald-500 text-2xl font-bold text-white shadow-glow-sm">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-surface-900">{user?.name}</h2>
            <p className="text-sm text-surface-500">{user?.email}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <Badge variant="info" dot>
                <Truck className="h-3 w-3" /> Ambulance Driver
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Personal information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Full name" defaultValue={user?.name}  icon={<User className="h-4 w-4" />} />
          <Input label="Email"     defaultValue={user?.email} icon={<Mail className="h-4 w-4" />} readOnly />
          <Input label="Phone"     defaultValue={user?.phone ?? ''} icon={<Phone className="h-4 w-4" />} />
          <Input label="Role"      defaultValue={user?.role}  readOnly />
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
