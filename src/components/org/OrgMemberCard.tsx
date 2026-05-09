import { X, ArrowUp, ArrowDown } from 'lucide-react';
import OrgRoleBadge from './OrgRoleBadge';
import type { OrgMember } from '@/types';

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
      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
        {member.displayName.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate capitalize">
          {member.displayName}
          {isCurrentUser && <span className="ml-1 text-xs text-muted-foreground font-normal">(you)</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
      </div>
      <OrgRoleBadge role={member.role} />
      {canManage && !isCurrentUser && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {member.role === 'member' && onPromote && (
            <button
              onClick={() => onPromote(member.userId)}
              className="p-1 rounded text-muted-foreground hover:text-amber-600"
              title="Promote to admin"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          )}
          {member.role === 'admin' && onDemote && (
            <button
              onClick={() => onDemote(member.userId)}
              className="p-1 rounded text-muted-foreground hover:text-sky-600"
              title="Demote to member"
            >
              <ArrowDown className="h-3.5 w-3.5" />
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
