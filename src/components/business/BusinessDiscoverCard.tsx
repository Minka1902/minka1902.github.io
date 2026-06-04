import { Link } from 'react-router-dom';
import { MapPin, CalendarPlus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistance } from '@/lib/geo';
import { BUSINESS_TYPES } from '@/types';
import type { DirectoryResult } from '@/hooks/useDirectory';

const TYPE_LABELS = Object.fromEntries(BUSINESS_TYPES.map(t => [t.type, t.label]));

export default function BusinessDiscoverCard({ biz }: { biz: DirectoryResult }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold leading-tight">{biz.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{TYPE_LABELS[biz.type] ?? biz.type}</p>
        </div>
        {biz.distance != null && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3 w-3" /> {formatDistance(biz.distance)}
          </span>
        )}
      </div>

      {biz.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{biz.description}</p>
      )}

      {(biz.location?.label || biz.city) && (
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {biz.location?.label ?? biz.city}
        </p>
      )}

      {biz.services && biz.services.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {biz.services.slice(0, 4).map(s => (
            <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{s}</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {biz.bookable ? (
          <Button asChild size="sm" className="gap-1.5">
            <Link to={`/discover/${biz.id}`}><CalendarPlus className="h-3.5 w-3.5" /> Book</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to={`/discover/${biz.id}`}>View <ChevronRight className="h-3.5 w-3.5" /></Link>
          </Button>
        )}
      </div>
    </div>
  );
}
