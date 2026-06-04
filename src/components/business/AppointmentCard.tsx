import { Clock, PawPrint, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fmtTime } from '@/lib/utils';
import type { Appointment, AppointmentStatus } from '@/types';

const STATUSES: { value: AppointmentStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No show' },
];

interface Props {
  appointment: Appointment;
  canEdit: boolean;
  onStatusChange: (status: AppointmentStatus) => void;
  onDelete: () => void;
}

export default function AppointmentCard({ appointment, canEdit, onStatusChange, onDelete }: Props) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-2 py-1 text-center">
            <span className="text-xs font-medium">{fmtTime(appointment.startAt)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
              {appointment.serviceLabel}
              {appointment.source === 'customer' && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  Online request
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{appointment.customerName}</span>
              {appointment.petName && <span className="inline-flex items-center gap-1"><PawPrint className="h-3 w-3" />{appointment.petName}</span>}
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(appointment.startAt)}–{fmtTime(appointment.endAt)}</span>
              {appointment.assignedStaffName && <span>· {appointment.assignedStaffName}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Select
            value={appointment.status}
            onValueChange={v => onStatusChange(v as AppointmentStatus)}
            disabled={!canEdit}
          >
            <SelectTrigger size="sm" className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {canEdit && (
            <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete appointment"><Trash2 className="h-3.5 w-3.5" /></Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
