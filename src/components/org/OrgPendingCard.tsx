import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/utils';
import type { PendingOrgMember } from '@/types';

interface Props {
  pending: PendingOrgMember;
  onApprove: (userId: string, displayName: string, email: string) => void;
  onReject: (userId: string) => void;
}

export default function OrgPendingCard({ pending, onApprove, onReject }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="h-9 w-9 rounded-full bg-amber-200 flex items-center justify-center text-sm font-semibold text-amber-800 shrink-0">
        {pending.displayName.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate capitalize">{pending.displayName}</p>
        <p className="text-xs text-muted-foreground truncate">{pending.email}</p>
        <p className="text-xs text-amber-700 mt-0.5">Requested {timeAgo(pending.requestedAt)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0 border-green-300 hover:bg-green-50 hover:text-green-700"
          onClick={() => onApprove(pending.userId, pending.displayName, pending.email)}
          title="Approve"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0 border-red-300 hover:bg-red-50 hover:text-destructive"
          onClick={() => onReject(pending.userId)}
          title="Reject"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
