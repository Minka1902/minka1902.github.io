import { Badge } from '@/components/ui/badge';
import type { BusinessRole } from '@/types';

interface Props {
  roleName?: string;
  roleId?: string;
  roles?: BusinessRole[];
}

/** Displays a role's name. Provide either `roleName` directly, or `roleId` + `roles`. */
export default function RoleBadge({ roleName, roleId, roles }: Props) {
  const name = roleName ?? roles?.find(r => r.id === roleId)?.name ?? roleId ?? 'Unknown';
  const isOwner = roleId === 'owner' || name.toLowerCase() === 'owner';
  return <Badge variant={isOwner ? 'default' : 'secondary'}>{name}</Badge>;
}
