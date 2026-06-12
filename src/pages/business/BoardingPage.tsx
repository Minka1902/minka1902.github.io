import { useState } from 'react';
import { BedDouble, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness, useStays } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import StayCard from '@/components/business/StayCard';
import StayForm, { type StayFormData } from '@/components/business/StayForm';
import OccupancyBar from '@/components/business/OccupancyBar';
import { occupancyByDate, todayStr } from '@/lib/occupancy';
import type { Stay } from '@/types';

interface Section {
  title: string;
  hint: string;
  filter: (s: Stay, today: string) => boolean;
}

const SECTIONS: Section[] = [
  { title: 'Requests', hint: 'Stay requests waiting on your approval.', filter: s => s.status === 'requested' },
  { title: 'In house', hint: 'Guests currently with you.', filter: s => s.status === 'checked_in' },
  { title: 'Upcoming', hint: 'Approved stays not yet checked in.', filter: (s, today) => s.status === 'approved' && s.endDate >= today },
  { title: 'History', hint: '', filter: (s, today) => s.status === 'checked_out' || s.status === 'declined' || s.status === 'cancelled' || (s.status === 'approved' && s.endDate < today) },
];

export default function BoardingPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const { stays, loading, createStay, setStayStatus, addDailyNote, deleteStay } = useStays(bid);

  const [addOpen, setAddOpen] = useState(false);

  const canView = can('view_boarding');
  const canManage = can('manage_boarding');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to boarding.</div>;
  }

  const capacity = activeBusiness.boarding?.capacity ?? 0;
  const today = todayStr();
  const occupiedToday = occupancyByDate(stays, today, 1)[today] ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Boarding &amp; daycare</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New stay
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium">Occupancy today</p>
            <p className="text-sm">
              <span className="text-lg font-bold">{occupiedToday}</span>
              <span className="text-muted-foreground"> / {capacity} spaces</span>
            </p>
          </div>
          {capacity > 0 ? (
            <OccupancyBar stays={stays} capacity={capacity} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Set your capacity in Settings to track occupancy and accept stay requests.
            </p>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : stays.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BedDouble className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No stays yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a stay or accept requests from the directory.</p>
          </div>
        </div>
      ) : (
        SECTIONS.map(section => {
          const items = stays.filter(s => section.filter(s, today));
          if (items.length === 0) return null;
          return (
            <section key={section.title} className="space-y-2">
              <div>
                <h2 className="text-sm font-semibold">{section.title} ({items.length})</h2>
                {section.hint && <p className="text-xs text-muted-foreground">{section.hint}</p>}
              </div>
              {items.map(s => (
                <StayCard
                  key={s.id}
                  stay={s}
                  canManage={canManage}
                  onSetStatus={(status) => setStayStatus(s, status, capacity)}
                  onAddNote={(text) => addDailyNote(s.id, text)}
                  onDelete={() => { if (confirm(`Delete ${s.petName}'s stay?`)) void deleteStay(s.id); }}
                />
              ))}
            </section>
          );
        })
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New stay</DialogTitle></DialogHeader>
          <StayForm
            bid={bid}
            onSubmit={async (data: StayFormData) => { await createStay(data); setAddOpen(false); }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
