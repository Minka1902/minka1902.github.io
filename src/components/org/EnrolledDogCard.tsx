import { LogIn, LogOut, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fmtTime } from '@/lib/utils';
import type { OrgEnrolledDog } from '@/types';

const SERVICE_LABELS: Record<string, string> = {
  grooming: 'Grooming', training: 'Training', daycare: 'Daycare',
  boarding: 'Boarding', walking: 'Walking', rehabilitation: 'Rehab',
  vet_care: 'Vet Care', spa: 'Spa', other: 'Other',
};

interface Props {
  enrollment: OrgEnrolledDog;
  canManage?: boolean;
  onCheckIn?: (dogId: string) => void;
  onCheckOut?: (dogId: string) => void;
  onSelect?: (dogId: string) => void;
}

export default function EnrolledDogCard({ enrollment, canManage, onCheckIn, onCheckOut, onSelect }: Props) {
  const initials = enrollment.dogName.slice(0, 2).toUpperCase();
  const assignedCount = enrollment.assignedStaff?.length ?? 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors ${onSelect ? 'cursor-pointer hover:bg-muted/50' : ''}`}
      onClick={() => onSelect?.(enrollment.dogId)}
    >
      {/* Avatar */}
      {enrollment.dogPhotoURL ? (
        <img src={enrollment.dogPhotoURL} alt={enrollment.dogName} className="h-11 w-11 rounded-full object-cover shrink-0" />
      ) : (
        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold capitalize truncate">{enrollment.dogName}</p>
          {enrollment.checkedIn && (
            <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px] px-1.5 py-0">
              In facility
            </Badge>
          )}
          {enrollment.status === 'paused' && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">Paused</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{enrollment.mainHumanName}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {enrollment.serviceTypes?.slice(0, 3).map(s => (
            <span key={s} className="text-[10px] bg-muted rounded-full px-1.5 py-0.5 text-muted-foreground">
              {SERVICE_LABELS[s] ?? s}
            </span>
          ))}
          {assignedCount > 0 && (
            <span className="text-[10px] text-muted-foreground">{assignedCount} staff assigned</span>
          )}
        </div>
        {enrollment.internalTags && enrollment.internalTags.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <Tag className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            {enrollment.internalTags.map(t => (
              <span key={t} className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-1.5 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}
        {enrollment.checkedIn && enrollment.checkedInAt && (
          <p className="text-[10px] text-green-700 mt-0.5">Checked in at {fmtTime(enrollment.checkedInAt)}</p>
        )}
      </div>

      {/* Check-in/out actions */}
      {canManage && (
        <div className="shrink-0" onClick={e => e.stopPropagation()}>
          {enrollment.checkedIn ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => onCheckOut?.(enrollment.dogId)}
            >
              <LogOut className="h-3 w-3" />
              Out
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs border-green-200 hover:bg-green-50 hover:text-green-700"
              onClick={() => onCheckIn?.(enrollment.dogId)}
            >
              <LogIn className="h-3 w-3" />
              In
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
