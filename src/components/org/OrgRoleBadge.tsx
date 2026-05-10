import { Badge } from '@/components/ui/badge';
import type { OrgMemberRole } from '@/types';

const styles: Record<OrgMemberRole | 'head', string> = {
  head:  'bg-amber-100 text-amber-900 border-amber-300',
  admin: 'bg-violet-100 text-violet-800 border-violet-200',
  staff: 'bg-sky-100 text-sky-800 border-sky-200',
};

const labels: Record<OrgMemberRole | 'head', string> = {
  head:  'Head',
  admin: 'Admin',
  staff: 'Staff',
};

export default function OrgRoleBadge({ role, isHead }: { role: OrgMemberRole; isHead?: boolean }) {
  const key = isHead ? 'head' : role;
  return (
    <Badge variant="outline" className={styles[key]}>
      {labels[key]}
    </Badge>
  );
}
