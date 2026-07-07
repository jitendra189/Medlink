import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hospitalsService } from '../../services/hospitals.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { cn } from '../../utils/cn';
import { MapPin, BedDouble, Locate, Building2 } from 'lucide-react';

export default function IcuFinderPage() {
  const [nearby, setNearby] = useState<{ lat: number; lng: number } | null>(null);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['hospitals-icu', nearby],
    queryFn: (): Promise<any> =>
      nearby
        ? hospitalsService.getNearby(nearby.lat, nearby.lng)
        : hospitalsService.getAll({ icuAvailable: true }),
  });

  const hospitals = Array.isArray(rawData) ? rawData : (rawData as any)?.data ?? [];

  const sorted = [...hospitals].sort(
    (a, b) => (b.icuBedsAvailable ?? 0) - (a.icuBedsAvailable ?? 0),
  );

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setNearby({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('Unable to get your location'),
    );
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900">Find ICU Beds Near You</h1>
          <p className="mt-2 text-surface-500">Live availability from hospitals in your area.</p>
        </div>
        <Button variant="outline" onClick={useMyLocation}>
          <Locate className="h-4 w-4" /> Use my location
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <BedDouble className="mb-3 h-10 w-10 text-surface-300" />
            <p className="font-semibold text-surface-800">No ICU beds available right now</p>
            <p className="mt-1 text-sm text-surface-500">Check again in a few minutes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((h) => {
            const total = h.icuBedsTotal || 1;
            const available = h.icuBedsAvailable ?? 0;
            const pct = Math.min(100, Math.round((available / total) * 100));
            const gaugeColor = pct >= 60 ? 'bg-emerald-500' : pct >= 25 ? 'bg-amber-500' : 'bg-rose-500';
            return (
              <Card key={h.id} interactive>
                <CardContent className="grid gap-4 py-5 md:grid-cols-[1fr_2fr_auto] md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <h3 className="text-base font-semibold text-surface-900">{h.name}</h3>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-surface-500">
                      <MapPin className="h-3 w-3" />
                      {[h.city, h.state].filter(Boolean).join(', ') || 'Location N/A'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-surface-600">
                        {available} of {h.icuBedsTotal ?? 0} beds free
                      </span>
                      <span className="font-semibold text-surface-500">{pct}%</span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-100">
                      <div className={cn('h-full rounded-full transition-all', gaugeColor)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <Badge variant={available > 0 ? 'success' : 'danger'} dot>
                    {available > 0 ? 'Available' : 'Full'}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
