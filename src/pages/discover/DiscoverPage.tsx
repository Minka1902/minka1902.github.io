import { useMemo, useState } from 'react';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessDirectory } from '@/hooks/useDirectory';
import { getCurrentPosition } from '@/lib/geo';
import BusinessDiscoverCard from '@/components/business/BusinessDiscoverCard';
import { BUSINESS_TYPES, type BusinessType, type GeoPoint } from '@/types';

const ALL = '__all__';

export default function DiscoverPage() {
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BusinessType | typeof ALL>(ALL);

  const { results, loading } = useBusinessDirectory(origin);

  const useMyLocation = async () => {
    setLocating(true);
    setLocError(null);
    try {
      setOrigin(await getCurrentPosition());
    } catch {
      setLocError('Could not get your location. Check browser permissions.');
    } finally {
      setLocating(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return results.filter(b => {
      if (typeFilter !== ALL && b.type !== typeFilter) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.city ?? '').toLowerCase().includes(q) ||
        (b.location?.label ?? '').toLowerCase().includes(q) ||
        (b.services ?? []).some(s => s.toLowerCase().includes(q))
      );
    });
  }, [results, search, typeFilter]);

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-1 sm:p-2">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Discover businesses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find dog walkers, groomers, vets, trainers and more near you.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={origin ? 'secondary' : 'default'} size="sm" className="gap-1.5" onClick={useMyLocation} disabled={locating}>
            <LocateFixed className="h-3.5 w-3.5" />
            {locating ? 'Locating…' : origin ? 'Location set' : 'Use my location'}
          </Button>
          {origin && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> Sorted by distance
            </span>
          )}
        </div>
        {locError && <p className="text-xs text-destructive">{locError}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, city or service"
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v as BusinessType | typeof ALL)}>
            <SelectTrigger className="sm:w-44"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {BUSINESS_TYPES.map(t => <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No businesses found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or clear the filters.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(b => <BusinessDiscoverCard key={b.id} biz={b} />)}
        </div>
      )}
    </div>
  );
}
