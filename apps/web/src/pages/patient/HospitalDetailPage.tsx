import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { hospitalsService } from '../../services/hospitals.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { StatsCard } from '../../components/ui/StatsCard';
import { MapPin, Phone, Star, BedDouble, Ambulance, Stethoscope, Building2, Calendar } from 'lucide-react';

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: hospital, isLoading } = useQuery({
    queryKey: ['hospital', id],
    queryFn: () => hospitalsService.getById(id!),
    enabled: !!id,
  });
  const { data: doctors } = useQuery({
    queryKey: ['hospital-doctors', id],
    queryFn: () => hospitalsService.getDoctors(id!),
    enabled: !!id,
  });

  if (isLoading) return <PageSpinner />;
  if (!hospital) return (
    <Card>
      <CardContent className="py-16 text-center">
        <Building2 className="mx-auto mb-3 h-10 w-10 text-surface-300" />
        <p className="font-semibold text-surface-800">Hospital not found</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 text-white shadow-glow-sm">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-surface-900">{hospital.name}</h1>
                <p className="mt-1 flex items-center gap-1 text-sm text-surface-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {[hospital.address, hospital.city, hospital.state].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-surface-500">
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 font-semibold text-amber-600">
                <Star className="h-3.5 w-3.5 fill-current" /> {hospital.rating?.toFixed(1) ?? '—'}
              </span>
              {hospital.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {hospital.phone}
                </span>
              )}
            </div>
          </div>
          <Button size="lg">
            <Calendar className="h-4 w-4" /> Book Appointment
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard icon={<BedDouble className="h-5 w-5" />}   accent="emerald" label="ICU Available" value={hospital.icuBedsAvailable ?? 0} />
        <StatsCard icon={<BedDouble className="h-5 w-5" />}   accent="brand"   label="ICU Total"     value={hospital.icuBedsTotal ?? 0} />
        <StatsCard icon={<Ambulance className="h-5 w-5" />}   accent="amber"   label="Ambulances"    value={hospital.ambulancesAvailable ?? 0} />
        <StatsCard icon={<Stethoscope className="h-5 w-5" />} accent="brand"   label="Doctors"       value={hospital.totalDoctors ?? 0} />
      </div>

      <Card>
        <CardHeader><CardTitle>Doctors</CardTitle></CardHeader>
        <CardContent>
          {!doctors?.length ? (
            <div className="py-10 text-center text-sm text-surface-500">No doctors listed for this hospital.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(doctors as any[]).map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-xl border border-surface-100 bg-surface-50 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 text-sm font-bold text-white">
                    {getInitials(d.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-surface-900">Dr. {d.name}</p>
                    <p className="truncate text-xs text-surface-500">{d.speciality ?? d.specialization ?? 'General'}</p>
                  </div>
                  <Badge variant={d.isAvailable ? 'success' : 'default'} dot>
                    {d.isAvailable ? 'Available' : 'Busy'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
