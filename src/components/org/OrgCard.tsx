import { Link } from 'react-router-dom';
import { Building2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Organization } from '@/types';

interface Props {
  org: Organization;
  isAdmin?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  rescue: 'Rescue',
  shelter: 'Shelter',
  breeder: 'Breeder',
  training: 'Training',
  daycare: 'Daycare',
  other: 'Other',
};

export default function OrgCard({ org, isAdmin }: Props) {
  const initials = org.name.slice(0, 2).toUpperCase();
  const memberCount = org.memberUserIds.length + org.adminUserIds.length;

  return (
    <Link to={`/orgs/${org.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-4 p-4">
          {org.logoURL ? (
            <img src={org.logoURL} alt={org.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold truncate">{org.name}</p>
              {isAdmin && <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-200">Admin</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {org.type && (
                <span className="text-xs text-muted-foreground">{TYPE_LABELS[org.type] ?? org.type}</span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {memberCount}
              </span>
            </div>
          </div>
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
