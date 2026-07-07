import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { hospitalsService } from '../../services/hospitals.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MapPin, Phone, Search, Locate, Star, BedDouble, Ambulance, Building2 } from 'lucide-react';

function HospitalCardSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-100 bg-white p-5">
      <div className="h-4 w-2/3 animate-pulse rounded bg-surface-100" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface-100" />
      <div className="mt-6 flex gap-3">
        <div className="h-6 w-20 animate-pulse rounded-full bg-surface-100" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-surface-100" />
      </div>
    </div>
  );
}

export default function HospitalsPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [nearby, setNearby] = useState<{ lat: number; lng: number } | null>(null);

  const { data: hospitals, isLoading, refetch } = useQuery({
    queryKey: ['hospitals', city, nearby],
    queryFn: () =>
      nearby
        ? hospitalsService.getNearby(nearby.lat, nearby.lng)
        : hospitalsService.getAll(city ? { city } : {}),
  });

  const filtered = hospitals?.filter((h) =>
    !search || h.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setNearby({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('Unable to get your location'),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Find Hospitals</h1>
        <p className="mt-2 text-surface-500">Search hospitals by name, city, or use your current location.</p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 py-4 md:grid-cols-[1fr_240px_auto]">
          <Input
            placeholder="Search by hospital name…"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input
            placeholder="Filter by city"
            icon={<MapPin className="h-4 w-4" />}
            value={city}
            onChange={(e) => { setCity(e.target.value); setNearby(null); }}
          />
          <Button variant="outline" onClick={useMyLocation}>
            <Locate className="h-4 w-4" /> Search Nearby
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <HospitalCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Building2 className="mb-3 h-10 w-10 text-surface-300" />
            <p className="font-semibold text-surface-800">No hospitals found</p>
            <p className="mt-1 text-sm text-surface-500">Try a different city or clear filters.</p>
            <Button className="mt-4" variant="outline" onClick={() => { setCity(''); setSearch(''); setNearby(null); refetch(); }}>
              Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h) => (
            <Card key={h.id} interactive className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-surface-900">{h.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-surface-500">
                      <MapPin className="h-3 w-3" />
                      {[h.city, h.state].filter(Boolean).join(', ') || 'Location N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600">
                    <Star className="h-3 w-3 fill-current" />
                    {h.rating?.toFixed(1) ?? '—'}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant={(h.icuBedsAvailable ?? 0) > 0 ? 'success' : 'danger'} dot>
                    <BedDouble className="h-3 w-3" /> {h.icuBedsAvailable ?? 0} ICU
                  </Badge>
                  <Badge variant="info">
                    <Ambulance className="h-3 w-3" /> {h.ambulancesAvailable ?? 0} ambulance
                  </Badge>
                </div>

                {h.phone && (
                  <p className="mt-3 flex items-center gap-1 text-xs text-surface-500">
                    <Phone className="h-3 w-3" /> {h.phone}
                  </p>
                )}

                <Link to={`/patient/hospitals/${h.id}`} className="mt-4 block">
                  <Button variant="outline" className="w-full">View details</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
