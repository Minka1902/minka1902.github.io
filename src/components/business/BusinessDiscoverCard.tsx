import { Link } from 'react-router-dom';
import { BedDouble, MapPin, CalendarPlus, ChevronRight, ShoppingCart, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{TYPE_LABELS[biz.type] ?? biz.type}</span>
            {biz.ratingAvg != null && (biz.ratingCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {biz.ratingAvg.toFixed(1)} ({biz.ratingCount})
              </span>
            )}
          </p>
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

      {(biz.orderable || biz.boarding?.requestsOpen) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {biz.orderable && (
            <Badge variant="secondary" className="gap-1"><ShoppingCart className="h-3 w-3" /> Online orders</Badge>
          )}
          {biz.boarding?.requestsOpen && (
            <Badge variant="secondary" className="gap-1"><BedDouble className="h-3 w-3" /> Boarding</Badge>
          )}
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
