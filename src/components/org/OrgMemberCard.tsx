import { X, ShieldCheck, ShieldMinus, BadgeCheck, AlertTriangle } from 'lucide-react';
import OrgRoleBadge from './OrgRoleBadge';
import type { OrgMember } from '@/types';

const STAFF_ROLE_LABELS: Record<string, string> = {
  manager: 'Manager', groomer: 'Groomer', trainer: 'Trainer',
  walker: 'Walker', daycare_staff: 'Daycare', vet_tech: 'Vet Tech',
  receptionist: 'Receptionist', behavior_specialist: 'Behavior', other: 'Other',
};

interface Props {
  member: OrgMember;
  canManage?: boolean;
  isCurrentUser?: boolean;
  onRemove?: (userId: string) => void;
  onPromote?: (userId: string) => void;
  onDemote?: (userId: string) => void;
}

export default function OrgMemberCard({ member, canManage, isCurrentUser, onRemove, onPromote, onDemote }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 group">
      <div className="relative shrink-0">
        {member.photoURL
          ? <img src={member.photoURL} alt={member.displayName} className="h-9 w-9 rounded-full object-cover" />
          : <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">{member.displayName.slice(0, 2).toUpperCase()}</div>
        }
        {!member.photoURL && <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-500 flex items-center justify-center" title="No profile photo"><AlertTriangle className="h-2 w-2 text-white" /></span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate capitalize flex items-center gap-1">
          {member.displayName}
          <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" aria-label="Verified member" />
          {isCurrentUser && <span className="text-xs text-muted-foreground font-normal">(you)</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        {member.staffRole && (
          <p className="text-xs text-muted-foreground">{STAFF_ROLE_LABELS[member.staffRole] ?? member.staffRole}</p>
        )}
      </div>
      <OrgRoleBadge role={member.role} />
      {canManage && !isCurrentUser && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {member.role === 'staff' && onPromote && (
            <button
              onClick={() => onPromote(member.userId)}
              className="p-1 rounded text-muted-foreground hover:text-amber-600"
              title="Promote to leader"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
            </button>
          )}
          {member.role === 'leader' && onDemote && (
            <button
              onClick={() => onDemote(member.userId)}
              className="p-1 rounded text-muted-foreground hover:text-sky-600"
              title="Demote to staff"
            >
              <ShieldMinus className="h-3.5 w-3.5" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(member.userId)}
              className="p-1 rounded text-muted-foreground hover:text-destructive"
              title="Remove member"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
