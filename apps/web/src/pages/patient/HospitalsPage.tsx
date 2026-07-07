import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { hospitalsService } from '../../services/hospitals.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { MapPin, Phone } from 'lucide-react';

export default function HospitalsPage() {
  const [city, setCity] = useState('');
  const { data: hospitals, isLoading } = useQuery({ queryKey: ['hospitals', city], queryFn: () => hospitalsService.getAll(city ? { city } : {}) });
  if (isLoading) return <PageSpinner />;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Find Hospitals</h1>
      <div className="mb-6 max-w-sm"><Input placeholder="Filter by city..." value={city} onChange={(e) => setCity(e.target.value)} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hospitals?.map((h) => (
          <Link key={h.id} to={`/patient/hospitals/${h.id}`}>
            <Card className="hover:border-blue-300 transition-colors cursor-pointer">
              <CardContent className="py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{h.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{h.city}, {h.state}</p>
                    {h.phone && <p className="text-sm text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" />{h.phone}</p>}
                  </div>
                  <Badge variant={(h.icuBedsAvailable ?? 0) > 0 ? 'success' : 'danger'}>{h.icuBedsAvailable ?? 0} ICU beds</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!hospitals?.length && <p className="text-gray-500">No hospitals found.</p>}
      </div>
    </div>
  );
}
