import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import RoleBadge from './RoleBadge';
import type { PendingHuman } from '@/types';

interface Props {
  request: PendingHuman;
  onApprove: (userId: string, displayName: string, email: string) => void;
  onReject: (userId: string) => void;
}

export default function PendingRequestCard({ request, onApprove, onReject }: Props) {
  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-sm font-semibold">
          {request.displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-medium capitalize">{request.displayName}</p>
          <p className="text-sm text-muted-foreground">{request.email}</p>
        </div>
        <RoleBadge role={request.requestedRole} />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onApprove(request.userId, request.displayName, request.email)}>
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReject(request.userId)}>
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
