import { useQuery } from '@tanstack/react-query';
import { hospitalsService } from '../../services/hospitals.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { MapPin } from 'lucide-react';

export default function IcuFinderPage() {
  const { data: hospitals, isLoading } = useQuery({ queryKey: ['hospitals-icu'], queryFn: () => hospitalsService.getAll({ icuAvailable: true }) });
  if (isLoading) return <PageSpinner />;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">ICU Finder</h1>
      <p className="text-gray-500 mb-6">Hospitals with ICU beds available right now.</p>
      <div className="space-y-3">
        {hospitals?.map((h) => (
          <Card key={h.id}><CardContent className="flex items-center justify-between py-4"><div><h3 className="font-semibold">{h.name}</h3><p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{h.city}, {h.state}</p></div><Badge variant="success">{h.icuBedsAvailable ?? 0} ICU beds free</Badge></CardContent></Card>
        ))}
        {!hospitals?.length && <p className="text-gray-500">No hospitals with available ICU beds right now.</p>}
      </div>
    </div>
  );
}
