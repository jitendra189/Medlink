import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/auth.store';
import { Role } from '@medlink/shared';
import {
  LayoutDashboard, Hospital, Droplets, AlertTriangle, Calendar,
  FileText, User, LogOut,
} from 'lucide-react';

const patientLinks = [
  { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patient/hospitals', icon: Hospital, label: 'Hospitals' },
  { to: '/patient/icu-finder', icon: Hospital, label: 'ICU Finder' },
  { to: '/patient/blood', icon: Droplets, label: 'Blood' },
  { to: '/patient/emergency', icon: AlertTriangle, label: 'Emergency' },
  { to: '/patient/bookings', icon: Calendar, label: 'Bookings' },
  { to: '/patient/prescriptions', icon: FileText, label: 'Prescriptions' },
  { to: '/patient/profile', icon: User, label: 'Profile' },
];

const hospitalLinks = [
  { to: '/hospital/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hospital/emergencies', icon: AlertTriangle, label: 'Emergencies' },
  { to: '/hospital/bookings', icon: Calendar, label: 'Bookings' },
  { to: '/hospital/doctors', icon: User, label: 'Doctors' },
  { to: '/hospital/resources', icon: Hospital, label: 'Resources' },
  { to: '/hospital/profile', icon: User, label: 'Profile' },
];

const donorLinks = [
  { to: '/donor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/donor/requests', icon: Droplets, label: 'Requests' },
  { to: '/donor/history', icon: FileText, label: 'History' },
  { to: '/donor/profile', icon: User, label: 'Profile' },
];

const driverLinks = [
  { to: '/driver/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/driver/requests', icon: AlertTriangle, label: 'Requests' },
  { to: '/driver/history', icon: FileText, label: 'History' },
  { to: '/driver/profile', icon: User, label: 'Profile' },
];

const linksByRole: Record<Role, typeof patientLinks> = {
  [Role.PATIENT]: patientLinks,
  [Role.HOSPITAL]: hospitalLinks,
  [Role.DONOR]: donorLinks,
  [Role.DRIVER]: driverLinks,
};

export function Sidebar() {
  const { pathname } = useLocation();
  const { user, clearAuth } = useAuthStore();
  const links = user ? linksByRole[user.role] : [];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-xl font-bold text-blue-600">MedLink</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === to ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-4">
        <div className="mb-2 px-3 py-2">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={clearAuth}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
