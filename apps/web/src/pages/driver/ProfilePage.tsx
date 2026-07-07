import { useAuthStore } from '../../stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { User } from 'lucide-react';

export default function DriverProfilePage() {
  const { user } = useAuthStore();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <Card className="max-w-lg">
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Driver Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{user?.name}</p></div>
          <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{user?.email}</p></div>
          <div><p className="text-sm text-gray-500">Role</p><p className="font-medium capitalize">{user?.role}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
