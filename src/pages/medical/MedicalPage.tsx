import { useState } from 'react';
import { Plus, CalendarClock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useMedical, useUpcomingDue } from '@/hooks/useMedical';
import MedicalRecordCard from '@/components/medical/MedicalRecordCard';
import MedicalRecordForm from '@/components/medical/MedicalRecordForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { MEDICAL_CATEGORIES } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';
import type { MedicalCategory } from '@/types';

const CATEGORY_ICONS: Record<string, string> = {
  vaccination: '💉',
  medication:  '💊',
  flea_tick:   '🐜',
  deworming:   '🪱',
  allergy:     '⚠️',
  diagnosis:   '🩺',
  surgery:     '🔬',
};

function DueSoonStrip({ dogId }: { dogId: string }) {
  const dueItems = useUpcomingDue(dogId);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (dueItems.length === 0) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-green-500/5 border-green-500/20">
        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
        <p className="text-sm font-medium text-green-600 dark:text-green-400">All clear — nothing due in 30 days</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-amber-500/5">
        <CalendarClock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Due within 30 days
        </span>
        <span className="ml-auto text-xs font-semibold bg-amber-500 text-white rounded-full px-2 py-0.5">
          {dueItems.length}
        </span>
      </div>
      <div className="divide-y divide-border/40">
        {dueItems.map(r => {
          const isOverdue = r.nextDueDate! < now - dayMs;
          const isToday = !isOverdue && r.nextDueDate! < now + dayMs;
          const catIcon = CATEGORY_ICONS[r.category] ?? '•';
          return (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-base">{catIcon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground">Due {fmtDate(r.nextDueDate!)}</p>
              </div>
              {isOverdue ? (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  <AlertTriangle className="h-2.5 w-2.5" /> Overdue
                </span>
              ) : isToday ? (
                <span className="text-[10px] font-bold uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Today
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                  {Math.ceil((r.nextDueDate! - now) / dayMs)}d
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategorySection({ dogId, category, label, icon }: {
  dogId: string; category: MedicalCategory; label: string; icon: string;
}) {
  const { records, loading, deleteRecord } = useMedical(dogId, category);
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<import('@/types').MedicalRecord | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className="font-semibold text-sm flex-1" style={{ fontFamily: 'var(--font-heading)' }}>{label}</h2>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : records.length === 0 ? (
        <button
          onClick={() => setAddOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-6 rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground/60 hover:text-muted-foreground hover:border-border transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add first {label.toLowerCase()} record
        </button>
      ) : (
        <div className="space-y-2">
          {records.map(r => (
            <MedicalRecordCard
              key={r.id}
              record={r}
              onDelete={deleteRecord}
              onEdit={setEditRecord}
            />
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {label}</DialogTitle>
          </DialogHeader>
          <MedicalRecordForm dogId={dogId} category={category} onSaved={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editRecord} onOpenChange={open => { if (!open) setEditRecord(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {label}</DialogTitle>
          </DialogHeader>
          {editRecord && (
            <MedicalRecordForm
              dogId={dogId}
              category={category}
              record={editRecord}
              onSaved={() => setEditRecord(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MedicalPage() {
  const { activeDog } = useDog();
  const [activeCategory, setActiveCategory] = useState<MedicalCategory>('vaccination');

  if (!activeDog) return <div className="text-muted-foreground p-4">No active dog selected.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5 lg:flex-1 lg:overflow-y-auto lg:p-4">
      {/* Header */}
      <div className="px-1 pt-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Medical
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">{activeDog.name}</p>
      </div>

      {/* Due Soon strip — always visible */}
      <DueSoonStrip dogId={activeDog.id} />

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {MEDICAL_CATEGORIES.map(c => {
          const isActive = activeCategory === c.category;
          return (
            <button
              key={c.category}
              onClick={() => setActiveCategory(c.category)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
              style={isActive
                ? { backgroundColor: '#F59E0B', color: '#1a1612' }
                : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
              }
            >
              <span>{CATEGORY_ICONS[c.category]}</span>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Active category records */}
      {MEDICAL_CATEGORIES.filter(c => c.category === activeCategory).map(c => (
        <CategorySection
          key={c.category}
          dogId={activeDog.id}
          category={c.category}
          label={c.label}
          icon={CATEGORY_ICONS[c.category]}
        />
      ))}
    </div>
  );
}
