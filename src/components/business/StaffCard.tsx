import { Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RoleBadge from './RoleBadge';
import type { BusinessRole, BusinessStaff } from '@/types';

interface Props {
  staff: BusinessStaff;
  roles: BusinessRole[];
  isOwnerStaff: boolean;
  canManage: boolean;
  onAssignRole: (roleId: string) => void;
  onToggleActive: (active: boolean) => void;
  onRemove: () => void;
}

export default function StaffCard({
  staff, roles, isOwnerStaff, canManage, onAssignRole, onToggleActive, onRemove,
}: Props) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-3">
        <Avatar className="h-10 w-10">
          {staff.photoURL ? <AvatarImage src={staff.photoURL} alt={staff.displayName} /> : null}
          <AvatarFallback>{staff.displayName?.slice(0, 2).toUpperCase() ?? '??'}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{staff.displayName}</p>
            <RoleBadge roleId={staff.roleId} roles={roles} />
            {!staff.active && <span className="text-xs text-muted-foreground">(inactive)</span>}
          </div>
          <p className="truncate text-xs text-muted-foreground">{staff.email}</p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Select
              value={staff.roleId}
              onValueChange={v => { if (v) onAssignRole(v); }}
              disabled={isOwnerStaff}
            >
              <SelectTrigger size="sm" className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Switch
              checked={staff.active}
              onCheckedChange={onToggleActive}
              disabled={isOwnerStaff}
              aria-label="Active"
            />
            <Button variant="ghost" size="icon-sm" onClick={onRemove} disabled={isOwnerStaff} aria-label="Remove staff">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
