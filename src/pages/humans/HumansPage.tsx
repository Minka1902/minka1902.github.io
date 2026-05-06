import { Link } from 'react-router-dom';
import { useDog } from '@/contexts/DogContext';
import { useHumans, usePendingHumans } from '@/hooks/useHumans';
import { useAuth } from '@/hooks/useAuth';
import HumanCard from '@/components/humans/HumanCard';
import PendingRequestCard from '@/components/humans/PendingRequestCard';
import { Separator } from '@/components/ui/separator';

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
        <h1 className="text-2xl font-bold">Team</h1>
        <Link to="/dogs/join" className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
          Join Another Dog
        </Link>
      </div>

      {isMain && pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-amber-600">Pending Requests</h2>
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
          <Separator />
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Team Members</h2>
        {humans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approved team members yet.</p>
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
