import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { hospitalsService } from '../../services/hospitals.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { MapPin, Phone, BedDouble, Search, Ambulance, Building2, Star, Locate } from 'lucide-react';

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
  const [city, setCity] = useState('');
  const [icuOnly, setIcuOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [nearby, setNearby] = useState<{ lat: number; lng: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['hospitals', search, icuOnly, page, nearby],
    queryFn: () =>
      nearby
        ? hospitalsService.getNearby(nearby.lat, nearby.lng)
        : hospitalsService.getAll({ city: search || undefined, icuAvailable: icuOnly || undefined, page, limit: 9 }),
    keepPreviousData: true,
  } as any);

  const hospitals = Array.isArray(data) ? data : ((data as any)?.data ?? []);
  const meta = Array.isArray(data) ? null : (data as any)?.meta;

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { setNearby({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setPage(1); },
      () => alert('Unable to get your location'),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Find Hospitals</h1>
        <p className="mt-2 text-surface-500">
          Search hospitals by name, city, or use your current location.
          {meta ? ` — ${meta.total} hospitals available` : ''}
        </p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 py-4 md:grid-cols-[1fr_auto_auto_auto]">
          <Input
            placeholder="Search by city…"
            icon={<MapPin className="h-4 w-4" />}
            value={city}
            onChange={(e) => { setCity(e.target.value); setNearby(null); }}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') { setSearch(city); setPage(1); } }}
          />
          <Button onClick={() => { setSearch(city); setPage(1); setNearby(null); }}>
            <Search className="h-4 w-4" /> Search
          </Button>
          <Button
            variant={icuOnly ? 'primary' : 'outline'}
            onClick={() => { setIcuOnly(!icuOnly); setPage(1); }}
          >
            <BedDouble className="h-4 w-4" /> ICU Only
          </Button>
          <Button variant="outline" onClick={useMyLocation}>
            <Locate className="h-4 w-4" /> Nearby
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <HospitalCardSkeleton key={i} />)}
        </div>
      ) : hospitals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Building2 className="mb-3 h-10 w-10 text-surface-300" />
            <p className="font-semibold text-surface-800">No hospitals found</p>
            <p className="mt-1 text-sm text-surface-500">Try a different city or remove the ICU filter.</p>
            <Button className="mt-4" variant="outline" onClick={() => { setCity(''); setSearch(''); setIcuOnly(false); setNearby(null); setPage(1); }}>
              Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hospitals.map((h: any) => (
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

          {meta && meta.totalPages > 1 && (
            <div className="mt-2">
              <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
              <p className="mt-3 text-center text-xs text-surface-400">
                Showing {hospitals.length} of {meta.total} hospitals
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
