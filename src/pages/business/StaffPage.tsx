import { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBusiness, useBusinessStaff, useBusinessRoles } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import StaffCard from '@/components/business/StaffCard';
import InviteStaffDialog from '@/components/business/InviteStaffDialog';

export default function StaffPage() {
  const { activeBusiness } = useBusiness();
  const { isOwner } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const { staff, loading, inviteStaff, assignRole, setStaffActive, removeStaff } = useBusinessStaff(bid);
  const { roles } = useBusinessRoles(bid);
  const { can } = usePermissions();

  const [inviteOpen, setInviteOpen] = useState(false);

  const canManage = can('manage_staff') || isOwner;

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to staff.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Staff</h1>
        <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-3.5 w-3.5" /> Invite staff
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-24" /></div>
          </div>
        ))}</div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No staff yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map(s => (
            <StaffCard
              key={s.userId}
              staff={s}
              roles={roles}
              isOwnerStaff={s.userId === activeBusiness.ownerUserId}
              canManage={canManage}
              onAssignRole={(roleId) => assignRole(s.userId, roleId)}
              onToggleActive={(active) => setStaffActive(s.userId, active)}
              onRemove={() => { if (confirm(`Remove ${s.displayName}?`)) removeStaff(s.userId); }}
            />
          ))}
        </div>
      )}

      <InviteStaffDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roles={roles}
        onInvite={inviteStaff}
      />
    </div>
  );
}
