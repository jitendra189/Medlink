import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hospitalsService } from '../../services/hospitals.service';
import { bloodService } from '../../services/blood.service';
import { emergencyService } from '../../services/emergency.service';
import { bookingsService } from '../../services/bookings.service';
import { StatsCard } from '../../components/ui/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuthStore } from '../../stores/auth.store';
import { getSocket } from '../../lib/socket';
import { SOCKET_EVENTS } from '@medlink/shared';
import {
  Building2, BedDouble, Droplets, AlertTriangle, Calendar, ArrowRight,
} from 'lucide-react';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function PatientDashboardPage() {
  const { user } = useAuthStore();
  const { data: hospitals, isLoading } = useQuery({
    queryKey: ['hospitals'], queryFn: () => hospitalsService.getAll(),
  });
  const { data: donors } = useQuery({ queryKey: ['donors'], queryFn: () => bloodService.searchDonors() });
  const { data: emergencies } = useQuery({ queryKey: ['my-emergencies'], queryFn: emergencyService.getMy });
  const { data: bookings } = useQuery({ queryKey: ['my-bookings'], queryFn: bookingsService.getMy });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => {};
    socket.on(SOCKET_EVENTS.EMERGENCY_UPDATED, handler);
    return () => { socket.off(SOCKET_EVENTS.EMERGENCY_UPDATED, handler); };
  }, []);

  if (isLoading) return <PageSpinner />;

  const totalIcu = hospitals?.reduce((sum, h) => sum + (h.icuBedsAvailable || 0), 0) ?? 0;
  const activeEmergencies = emergencies?.filter((e) => ['pending', 'accepted'].includes(e.status)).length ?? 0;

  const quickActions = [
    { to: '/patient/emergency', icon: AlertTriangle, label: 'SOS Emergency', desc: 'Instant help', bg: 'bg-rose-500 hover:bg-rose-600' },
    { to: '/patient/hospitals', icon: Building2,     label: 'Find Hospitals', desc: 'Nearby providers', bg: 'bg-brand-600 hover:bg-brand-700' },
    { to: '/patient/blood',     icon: Droplets,      label: 'Request Blood',  desc: 'Match donors',    bg: 'bg-amber-500 hover:bg-amber-600' },
    { to: '/patient/bookings',  icon: Calendar,      label: 'Book Doctor',    desc: 'Schedule visit',  bg: 'bg-emerald-500 hover:bg-emerald-600' },
  ];

  const recent = [
    ...(bookings ?? []).slice(0, 2).map((b: any) => ({
      id: `b-${b.id}`,
      title: `Appointment with Dr. ${b.doctor?.name ?? 'Unknown'}`,
      subtitle: `${b.hospital?.name ?? ''} • ${new Date(b.scheduledAt).toLocaleString()}`,
      status: b.status as string,
    })),
    ...(emergencies ?? []).slice(0, 1).map((e) => ({
      id: `e-${e.id}`,
      title: `${e.type} Emergency`,
      subtitle: new Date(e.createdAt).toLocaleString(),
      status: e.status as string,
    })),
  ].slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-surface-500">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-surface-900">
          {greeting()}, {user?.name?.split(' ')[0] ?? 'there'}
          <span className="ml-2" aria-hidden>👋</span>
        </h1>
        <p className="mt-2 text-surface-500">Here's what's available near you right now.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={<Building2 className="h-5 w-5" />} accent="brand"   label="Hospitals Nearby"    value={hospitals?.length ?? 0} />
        <StatsCard icon={<BedDouble className="h-5 w-5" />} accent="emerald" label="ICU Beds Available"  value={totalIcu} />
        <StatsCard icon={<Droplets className="h-5 w-5" />}  accent="rose"    label="Blood Donors"        value={donors?.length ?? 0} />
        <StatsCard icon={<AlertTriangle className="h-5 w-5" />} accent="amber" label="Active Requests"    value={activeEmergencies} />
      </div>

      <div>
        <h2 className="section-title mb-4">Quick actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map(({ to, icon: Icon, label, desc, bg }) => (
            <Link
              key={to}
              to={to}
              className={`${bg} group flex items-center justify-between rounded-2xl p-6 text-white shadow-card transition hover:shadow-card-hover`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{label}</p>
                  <p className="text-sm text-white/80">{desc}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <Link to="/patient/bookings" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Calendar className="mb-3 h-8 w-8 text-surface-300" />
              <p className="text-sm text-surface-500">No recent activity yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-surface-100">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-surface-900">{r.title}</p>
                    <p className="text-xs text-surface-500">{r.subtitle}</p>
                  </div>
                  <Badge
                    variant={r.status === 'confirmed' || r.status === 'accepted' ? 'success'
                      : r.status === 'cancelled' || r.status === 'rejected' ? 'danger'
                      : r.status === 'completed' || r.status === 'resolved' ? 'info'
                      : 'pending'}
                    dot
                  >
                    {r.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
