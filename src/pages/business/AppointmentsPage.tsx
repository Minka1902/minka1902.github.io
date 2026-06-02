import { useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useBusiness, useAppointments } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import AppointmentCalendar from '@/components/business/AppointmentCalendar';
import AppointmentForm, { type AppointmentFormData } from '@/components/business/AppointmentForm';
import type { Appointment, AppointmentStatus } from '@/types';

export default function AppointmentsPage() {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const { appointments, loading, createAppointment, updateAppointment, deleteAppointment } = useAppointments(bid);

  const [addOpen, setAddOpen] = useState(false);

  const canView = can('view_appointments');
  const canManageAll = can('manage_appointments');
  const canManageOwn = can('manage_own_appointments');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManageAll && !canManageOwn) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to appointments.</div>;
  }

  const canEditAppt = (appt: Appointment) =>
    canManageAll || (canManageOwn && appt.assignedStaffId === user?.uid);
  const canCreate = canManageAll || canManageOwn;

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Appointments</h1>
        {canCreate && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New appointment
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No appointments</p>
            <p className="mt-1 text-sm text-muted-foreground">Schedule your first appointment.</p>
          </div>
        </div>
      ) : (
        <AppointmentCalendar
          appointments={appointments}
          canEdit={canEditAppt}
          onStatusChange={(appt, status: AppointmentStatus) => updateAppointment(appt.id, { status })}
          onDelete={(appt) => { if (confirm('Delete this appointment?')) deleteAppointment(appt.id); }}
        />
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New appointment</DialogTitle></DialogHeader>
          <AppointmentForm
            bid={bid}
            onSubmit={async (data: AppointmentFormData) => { await createAppointment(data); setAddOpen(false); }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
