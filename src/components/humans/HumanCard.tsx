import { X, Building2 } from 'lucide-react';
import RoleBadge from './RoleBadge';
import { BUSINESS_TYPES, type DogHuman } from '@/types';

interface Props {
  human: DogHuman;
  canRevoke?: boolean;
  onRevoke?: (userId: string) => void;
}

const BIZ_TYPE_LABELS = Object.fromEntries(BUSINESS_TYPES.map(t => [t.type, t.label]));

export default function HumanCard({ human, canRevoke, onRevoke }: Props) {
  const subtitle = human.isBusiness
    ? (human.businessType ? `${BIZ_TYPE_LABELS[human.businessType] ?? 'Business'} · Business` : 'Business')
    : human.email;
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 group">
      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
        {human.isBusiness ? <Building2 className="h-4 w-4" /> : human.displayName.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate capitalize">{human.displayName}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <RoleBadge role={human.role} />
      {canRevoke && onRevoke && (
        <button
          onClick={() => onRevoke(human.userId)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive"
          aria-label="Remove"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
