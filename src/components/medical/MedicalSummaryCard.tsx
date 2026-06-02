import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarClock, Pill } from 'lucide-react';
import { useUpcomingDue, useActiveMedications } from '@/hooks/useMedical';

interface Props {
  dogId: string;
}

export default function MedicalSummaryCard({ dogId }: Props) {
  const navigate = useNavigate();
  const dueItems = useUpcomingDue(dogId);
  const activeMeds = useActiveMedications(dogId);

  const now = Date.now();
  const dayMs = 86_400_000;
  const overdueCount = dueItems.filter(r => r.nextDueDate! < now - dayMs).length;
  const dueSoonCount = dueItems.filter(r => r.nextDueDate! >= now - dayMs && r.nextDueDate! < now + 7 * dayMs).length;
  const activeMedCount = activeMeds.length;

  return (
    <button
      type="button"
      onClick={() => navigate('/medical')}
      className="w-full rounded-xl border bg-card p-3 hover:bg-muted/30 transition-colors text-left"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Medical</p>
      <div className="grid grid-cols-3 gap-2">
        {/* Overdue */}
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <div>
            <p className="font-mono text-sm font-bold text-red-500">{overdueCount}</p>
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground leading-tight">Overdue</p>
          </div>
        </div>
        {/* Due soon */}
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <div>
            <p className="font-mono text-sm font-bold text-amber-500">{dueSoonCount}</p>
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground leading-tight">Due soon</p>
          </div>
        </div>
        {/* Active meds */}
        <div className="flex items-center gap-1.5">
          <Pill className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <div>
            <p className="font-mono text-sm font-bold text-emerald-500">{activeMedCount}</p>
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground leading-tight">Active meds</p>
          </div>
        </div>
      </div>
    </button>
  );
}
