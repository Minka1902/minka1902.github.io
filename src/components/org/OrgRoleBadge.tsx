import { Badge } from '@/components/ui/badge';
import type { OrgMemberRole } from '@/types';

const styles: Record<OrgMemberRole, string> = {
  leader: 'bg-amber-100 text-amber-800 border-amber-200',
  staff:  'bg-sky-100 text-sky-800 border-sky-200',
};

export default function OrgRoleBadge({ role }: { role: OrgMemberRole }) {
  return (
    <Badge variant="outline" className={styles[role]}>
      {role === 'leader' ? 'Leader' : 'Staff'}
    </Badge>
  );
}
