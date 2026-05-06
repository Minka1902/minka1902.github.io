import { Badge } from '@/components/ui/badge';
import { HUMAN_ROLES } from '@/lib/constants';
import type { HumanRole } from '@/types';

interface Props { role: HumanRole }

export default function RoleBadge({ role }: Props) {
  const label = HUMAN_ROLES.find(r => r.role === role)?.label ?? role;
  return <Badge variant="secondary" className="capitalize">{label}</Badge>;
}
