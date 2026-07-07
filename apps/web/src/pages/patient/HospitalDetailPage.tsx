import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { hospitalsService } from '../../services/hospitals.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { MapPin, Phone, User } from 'lucide-react';

export default function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: hospital, isLoading } = useQuery({ queryKey: ['hospital', id], queryFn: () => hospitalsService.getById(id!) });
  const { data: doctors } = useQuery({ queryKey: ['hospital-doctors', id], queryFn: () => hospitalsService.getDoctors(id!) });
  if (isLoading) return <PageSpinner />;
  if (!hospital) return <p className="text-gray-500">Hospital not found.</p>;
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{hospital.name}</h1>
      <p className="text-gray-500 flex items-center gap-1 mb-6"><MapPin className="h-4 w-4" />{hospital.address}, {hospital.city}, {hospital.state}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'ICU Available', value: hospital.icuBedsAvailable ?? 0, color: 'text-green-600' },
          { label: 'ICU Total', value: hospital.icuBedsTotal ?? 0, color: 'text-blue-600' },
          { label: 'Ambulances', value: hospital.ambulancesAvailable ?? 0, color: 'text-orange-600' },
          { label: 'Total Doctors', value: hospital.totalDoctors ?? 0, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardHeader><CardTitle className="text-sm text-gray-500">{label}</CardTitle></CardHeader><CardContent><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>
      {hospital.phone && <p className="text-sm text-gray-500 flex items-center gap-1 mb-6"><Phone className="h-4 w-4" />{hospital.phone}</p>}
      <h2 className="text-lg font-semibold mb-4">Doctors</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(doctors as any[])?.map((d: any) => (
          <Card key={d.id}><CardContent className="flex items-center gap-3 py-4"><User className="h-8 w-8 text-blue-600 bg-blue-50 rounded-full p-1.5" /><div><p className="font-medium">{d.name}</p><p className="text-sm text-gray-500">{d.specialization}</p></div><Badge variant={d.isAvailable ? 'success' : 'default'} className="ml-auto">{d.isAvailable ? 'Available' : 'Busy'}</Badge></CardContent></Card>
        ))}
        {!doctors?.length && <p className="text-gray-500 text-sm">No doctors listed.</p>}
      </div>
    </div>
  );
}
