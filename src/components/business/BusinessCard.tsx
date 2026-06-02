import { Building2, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { BUSINESS_TYPES, type Business } from '@/types';

interface Props {
  business: Business;
  active?: boolean;
  onSelect?: (business: Business) => void;
}

export default function BusinessCard({ business, active, onSelect }: Props) {
  const typeLabel = BUSINESS_TYPES.find(t => t.type === business.type)?.label ?? business.type;
  return (
    <button
      type="button"
      onClick={() => onSelect?.(business)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/50',
        active && 'border-primary ring-1 ring-primary',
      )}
    >
      <Avatar className="h-10 w-10">
        {business.logoURL ? <AvatarImage src={business.logoURL} alt={business.name} /> : null}
        <AvatarFallback><Building2 className="h-5 w-5" /></AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{business.name}</p>
        <p className="truncate text-xs text-muted-foreground">{typeLabel}</p>
      </div>
      {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}
