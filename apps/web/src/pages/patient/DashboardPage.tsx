import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hospitalsService } from '../../services/hospitals.service';
import { bloodService } from '../../services/blood.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuthStore } from '../../stores/auth.store';
import { getSocket } from '../../lib/socket';
import { SOCKET_EVENTS } from '@medlink/shared';
import { Hospital, Droplets, AlertTriangle, Calendar } from 'lucide-react';

export default function PatientDashboardPage() {
  const { user } = useAuthStore();
  const { data: hospitals, isLoading } = useQuery({ queryKey: ['hospitals'], queryFn: () => hospitalsService.getAll() });
  const { data: donors } = useQuery({ queryKey: ['donors'], queryFn: () => bloodService.searchDonors() });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on(SOCKET_EVENTS.EMERGENCY_UPDATED, () => {});
    return () => { socket.off(SOCKET_EVENTS.EMERGENCY_UPDATED); };
  }, []);

  if (isLoading) return <PageSpinner />;
  const totalIcu = hospitals?.reduce((sum, h) => sum + (h.icuBedsAvailable || 0), 0) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user?.name}</h1>
      <p className="text-gray-500 mb-8">Here's what's available near you right now.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Hospitals</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-blue-600">{hospitals?.length ?? 0}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">ICU Beds Available</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{totalIcu}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Blood Donors</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{donors?.length ?? 0}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/patient/emergency', icon: AlertTriangle, label: 'Emergency SOS', color: 'bg-red-600 hover:bg-red-700 text-white' },
          { to: '/patient/hospitals', icon: Hospital, label: 'Find Hospitals', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
          { to: '/patient/blood', icon: Droplets, label: 'Request Blood', color: 'bg-orange-600 hover:bg-orange-700 text-white' },
          { to: '/patient/bookings', icon: Calendar, label: 'Book Doctor', color: 'bg-green-600 hover:bg-green-700 text-white' },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to} className={`flex flex-col items-center justify-center rounded-xl p-6 gap-3 font-medium transition-colors ${color}`}>
            <Icon className="h-8 w-8" /><span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
