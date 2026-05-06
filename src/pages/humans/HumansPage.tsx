import { Link } from 'react-router-dom';
import { Users, UserPlus, Clock } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useHumans, usePendingHumans } from '@/hooks/useHumans';
import { useAuth } from '@/hooks/useAuth';
import HumanCard from '@/components/humans/HumanCard';
import PendingRequestCard from '@/components/humans/PendingRequestCard';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function HumansPage() {
  const { activeDog, isMainHuman } = useDog();
  const { user } = useAuth();
  const dogId = activeDog?.id ?? '';
  const { humans, revokeHuman } = useHumans(dogId);
  const { pending, approveHuman, rejectHuman } = usePendingHumans(dogId);
  const isMain = isMainHuman(dogId);

  if (!activeDog) {
    return <div className="text-muted-foreground">No active dog selected.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <Link to="/dogs/join" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
          <UserPlus className="h-3.5 w-3.5" /> Join Another Dog
        </Link>
      </div>

      {/* Pending requests */}
      {isMain && pending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {pending.length} pending request{pending.length !== 1 ? 's' : ''}
            </h2>
          </div>
          {pending.map(req => (
            <PendingRequestCard
              key={req.userId}
              request={req}
              onApprove={(userId, displayName, email) =>
                approveHuman(userId, displayName, email, req.requestedRole)
              }
              onReject={rejectHuman}
            />
          ))}
        </div>
      )}

      {/* Team members */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Team Members ({humans.length})
        </h2>
        {humans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 rounded-xl border border-dashed bg-background gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Just you so far</p>
              <p className="text-sm text-muted-foreground mt-1">Invite caregivers, trainers, or walkers to join <span className="capitalize">{activeDog.name}</span>'s team.</p>
            </div>
          </div>
        ) : (
          humans.map(human => (
            <HumanCard
              key={human.userId}
              human={human}
              canRevoke={isMain && human.userId !== user?.uid}
              onRevoke={revokeHuman}
            />
          ))
        )}
      </div>
    </div>
  );
}
