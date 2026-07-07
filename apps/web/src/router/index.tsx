import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { PageSpinner } from '../components/ui/Spinner';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Role } from '@medlink/shared';

const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<PageSpinner />}><Component /></Suspense>
);

const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));

const PatientDashboard = lazy(() => import('../pages/patient/DashboardPage'));
const PatientHospitals = lazy(() => import('../pages/patient/HospitalsPage'));
const PatientHospitalDetail = lazy(() => import('../pages/patient/HospitalDetailPage'));
const PatientIcuFinder = lazy(() => import('../pages/patient/IcuFinderPage'));
const PatientBlood = lazy(() => import('../pages/patient/BloodPage'));
const PatientEmergency = lazy(() => import('../pages/patient/EmergencyPage'));
const PatientBookings = lazy(() => import('../pages/patient/BookingsPage'));
const PatientPrescriptions = lazy(() => import('../pages/patient/PrescriptionsPage'));
const PatientProfile = lazy(() => import('../pages/patient/ProfilePage'));

const HospitalDashboard = lazy(() => import('../pages/hospital/DashboardPage'));
const HospitalEmergencies = lazy(() => import('../pages/hospital/EmergenciesPage'));
const HospitalBookings = lazy(() => import('../pages/hospital/BookingsPage'));
const HospitalDoctors = lazy(() => import('../pages/hospital/DoctorsPage'));
const HospitalResources = lazy(() => import('../pages/hospital/ResourcesPage'));
const HospitalProfile = lazy(() => import('../pages/hospital/ProfilePage'));

const DonorDashboard = lazy(() => import('../pages/donor/DashboardPage'));
const DonorRequests = lazy(() => import('../pages/donor/RequestsPage'));
const DonorHistory = lazy(() => import('../pages/donor/HistoryPage'));
const DonorProfile = lazy(() => import('../pages/donor/ProfilePage'));

const DriverDashboard = lazy(() => import('../pages/driver/DashboardPage'));
const DriverRequests = lazy(() => import('../pages/driver/RequestsPage'));
const DriverHistory = lazy(() => import('../pages/driver/HistoryPage'));
const DriverProfile = lazy(() => import('../pages/driver/ProfilePage'));

export const router = createBrowserRouter([
  { path: '/', element: wrap(LandingPage) },
  { path: '/login', element: wrap(LoginPage) },
  { path: '/register', element: wrap(RegisterPage) },
  {
    element: <ProtectedRoute allowedRoles={[Role.PATIENT]}><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: '/patient/dashboard', element: wrap(PatientDashboard) },
      { path: '/patient/hospitals', element: wrap(PatientHospitals) },
      { path: '/patient/hospitals/:id', element: wrap(PatientHospitalDetail) },
      { path: '/patient/icu-finder', element: wrap(PatientIcuFinder) },
      { path: '/patient/blood', element: wrap(PatientBlood) },
      { path: '/patient/emergency', element: wrap(PatientEmergency) },
      { path: '/patient/bookings', element: wrap(PatientBookings) },
      { path: '/patient/prescriptions', element: wrap(PatientPrescriptions) },
      { path: '/patient/profile', element: wrap(PatientProfile) },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[Role.HOSPITAL]}><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: '/hospital/dashboard', element: wrap(HospitalDashboard) },
      { path: '/hospital/emergencies', element: wrap(HospitalEmergencies) },
      { path: '/hospital/bookings', element: wrap(HospitalBookings) },
      { path: '/hospital/doctors', element: wrap(HospitalDoctors) },
      { path: '/hospital/resources', element: wrap(HospitalResources) },
      { path: '/hospital/profile', element: wrap(HospitalProfile) },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[Role.DONOR]}><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: '/donor/dashboard', element: wrap(DonorDashboard) },
      { path: '/donor/requests', element: wrap(DonorRequests) },
      { path: '/donor/history', element: wrap(DonorHistory) },
      { path: '/donor/profile', element: wrap(DonorProfile) },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[Role.DRIVER]}><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: '/driver/dashboard', element: wrap(DriverDashboard) },
      { path: '/driver/requests', element: wrap(DriverRequests) },
      { path: '/driver/history', element: wrap(DriverHistory) },
      { path: '/driver/profile', element: wrap(DriverProfile) },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
