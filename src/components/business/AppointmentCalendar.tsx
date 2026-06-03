import { useMemo } from 'react';
import { fmtDate } from '@/lib/utils';
import AppointmentCard from './AppointmentCard';
import type { Appointment, AppointmentStatus } from '@/types';

interface Props {
  appointments: Appointment[];
  canEdit: (appt: Appointment) => boolean;
  onStatusChange: (appt: Appointment, status: AppointmentStatus) => void;
  onDelete: (appt: Appointment) => void;
}

/** Vertical agenda list grouped by day (calendar-lite). */
export default function AppointmentCalendar({ appointments, canEdit, onStatusChange, onDelete }: Props) {
  const groups = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => a.startAt - b.startAt);
    const map = new Map<string, Appointment[]>();
    for (const appt of sorted) {
      const key = fmtDate(appt.startAt);
      const arr = map.get(key) ?? [];
      arr.push(appt);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [appointments]);

  return (
    <div className="space-y-6">
      {groups.map(([day, items]) => (
        <div key={day} className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">{day}</p>
          <div className="space-y-2">
            {items.map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                canEdit={canEdit(appt)}
                onStatusChange={s => onStatusChange(appt, s)}
                onDelete={() => onDelete(appt)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
