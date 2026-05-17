import { Link } from 'react-router-dom';
import { Building2, ExternalLink, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Organization } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  rescue: 'Rescue', shelter: 'Shelter', breeder: 'Breeder',
  training: 'Training', daycare: 'Daycare', spa: 'Spa',
  veterinary: 'Veterinary', boarding: 'Boarding', other: 'Other',
};

interface Props {
  org: Organization;
}

export default function OrgTeamCard({ org }: Props) {
  const memberCount = (org.leaderUserIds?.length ?? 0) + (org.staffUserIds?.length ?? 0);

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      {org.logoURL ? (
        <img src={org.logoURL} alt={org.name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate">{org.name}</p>
          {org.type && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {TYPE_LABELS[org.type] ?? org.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <Link
        to={`/orgs/${org.id}`}
        className={cn(
          'shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium',
          'border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors',
        )}
      >
        View <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}
