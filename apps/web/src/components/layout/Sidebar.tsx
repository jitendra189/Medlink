import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/auth.store';
import { Role } from '@medlink/shared';
import {
  LayoutDashboard, Building2, Droplets, AlertTriangle, Calendar,
  FileText, User, LogOut, HeartPulse, BedDouble, Stethoscope, Package,
  History, Truck, Search,
} from 'lucide-react';

type NavLink = { to: string; icon: typeof LayoutDashboard; label: string };

const patientLinks: NavLink[] = [
  { to: '/patient/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patient/hospitals',     icon: Building2,       label: 'Hospitals' },
  { to: '/patient/icu-finder',    icon: BedDouble,       label: 'ICU Finder' },
  { to: '/patient/blood',         icon: Droplets,        label: 'Blood' },
  { to: '/patient/emergency',     icon: AlertTriangle,   label: 'Emergency' },
  { to: '/patient/bookings',      icon: Calendar,        label: 'Bookings' },
  { to: '/patient/prescriptions', icon: FileText,        label: 'Prescriptions' },
  { to: '/patient/profile',       icon: User,            label: 'Profile' },
];

const hospitalLinks: NavLink[] = [
  { to: '/hospital/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hospital/emergencies', icon: AlertTriangle,   label: 'Emergencies' },
  { to: '/hospital/bookings',    icon: Calendar,        label: 'Bookings' },
  { to: '/hospital/doctors',     icon: Stethoscope,     label: 'Doctors' },
  { to: '/hospital/resources',   icon: Package,         label: 'Resources' },
  { to: '/hospital/profile',     icon: Building2,       label: 'Profile' },
];

const donorLinks: NavLink[] = [
  { to: '/donor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/donor/requests',  icon: Droplets,        label: 'Requests' },
  { to: '/donor/history',   icon: History,         label: 'History' },
  { to: '/donor/profile',   icon: User,            label: 'Profile' },
];

const driverLinks: NavLink[] = [
  { to: '/driver/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/driver/requests',  icon: Search,          label: 'Requests' },
  { to: '/driver/history',   icon: History,         label: 'History' },
  { to: '/driver/profile',   icon: Truck,           label: 'Profile' },
];

const linksByRole: Record<Role, NavLink[]> = {
  [Role.PATIENT]:  patientLinks,
  [Role.HOSPITAL]: hospitalLinks,
  [Role.DONOR]:    donorLinks,
  [Role.DRIVER]:   driverLinks,
};

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function roleLabel(role?: Role) {
  switch (role) {
    case Role.PATIENT:  return 'Patient';
    case Role.HOSPITAL: return 'Hospital Admin';
    case Role.DONOR:    return 'Blood Donor';
    case Role.DRIVER:   return 'Ambulance Driver';
    default: return '';
  }
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { user, clearAuth } = useAuthStore();
  const links = user ? linksByRole[user.role] : [];

  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col bg-navy-900 text-white">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/5 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-glow-sm">
          <HeartPulse className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">MedLink</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-surface-500">
          Menu
        </p>
        {links.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              className={cn('nav-link', active ? 'nav-link-active' : 'nav-link-inactive')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/5 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-navy-800/60 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 text-sm font-bold text-white">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name ?? 'Guest'}</p>
            <p className="truncate text-xs text-surface-400">{roleLabel(user?.role)}</p>
          </div>
        </div>
        <button
          onClick={clearAuth}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-surface-300 transition hover:bg-rose-500/10 hover:text-rose-400"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
