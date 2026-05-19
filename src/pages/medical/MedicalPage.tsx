import { useState } from 'react';
import { Plus, AlertTriangle, CalendarClock, CheckCircle, Syringe, Pill, Bug, Zap, Stethoscope, Scissors, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useMedical, useUpcomingDue, useActiveMedications } from '@/hooks/useMedical';
import MedicalRecordCard from '@/components/medical/MedicalRecordCard';
import MedicalRecordForm from '@/components/medical/MedicalRecordForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MEDICAL_CATEGORIES } from '@/lib/constants';
import type { MedicalCategory, MedicalRecord } from '@/types';

// ---------------------------------------------------------------------------
// CATEGORY_CONFIG
// ---------------------------------------------------------------------------

type CategoryConfig = { icon: LucideIcon; color: string; shortLabel: string; longLabel: string };

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  vaccination: { icon: Syringe,     color: '#0EA5E9', shortLabel: 'Vaccines',  longLabel: 'Vaccinations' },
  medication:  { icon: Pill,        color: '#8B5CF6', shortLabel: 'Meds',      longLabel: 'Medications'  },
  flea_tick:   { icon: Bug,         color: '#10B981', shortLabel: 'Flea+Tick', longLabel: 'Flea & Tick'  },
  deworming:   { icon: Activity,    color: '#F97316', shortLabel: 'Deworm',    longLabel: 'Deworming'    },
  allergy:     { icon: Zap,         color: '#F43F5E', shortLabel: 'Allergy',   longLabel: 'Allergies'    },
  diagnosis:   { icon: Stethoscope, color: '#3B82F6', shortLabel: 'Diagnosis', longLabel: 'Diagnoses'    },
  surgery:     { icon: Scissors,    color: '#64748B', shortLabel: 'Surgery',   longLabel: 'Surgeries'    },
};

// ---------------------------------------------------------------------------
// Module-level constant
// ---------------------------------------------------------------------------

const dayMs = 86_400_000;

// ---------------------------------------------------------------------------
// HealthSummaryBar
// ---------------------------------------------------------------------------

function HealthSummaryBar({ dueItems, dogId }: { dueItems: MedicalRecord[]; dogId: string }) {
  const activeMeds = useActiveMedications(dogId);

  const now = Date.now();

  const overdueCount = dueItems.filter(r => r.nextDueDate! < now - dayMs).length;
  const dueSoonCount = dueItems.filter(r => r.nextDueDate! >= now - dayMs && r.nextDueDate! < now + 7 * dayMs).length;
  const activeMedCount = activeMeds.length;

  if (overdueCount === 0 && dueSoonCount === 0 && activeMedCount === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-green-500/5 border-green-500/20 px-4 py-3">
        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
        <p className="text-sm font-medium text-green-600 dark:text-green-400">All clear — nothing due in 30 days</p>
      </div>
    );
  }

  const tiles: { icon: LucideIcon; color: string; count: number; label: string }[] = [
    { icon: AlertTriangle, color: '#EF4444', count: overdueCount,  label: 'Overdue'     },
    { icon: CalendarClock, color: '#F59E0B', count: dueSoonCount,  label: 'Due soon'    },
    { icon: Pill,          color: '#10B981', count: activeMedCount, label: 'Active meds' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {tiles.map(({ icon: IconComponent, color, count, label }) => (
        <div key={label} className="relative overflow-hidden rounded-xl border bg-card p-3">
          <IconComponent
            className="absolute -right-1 -top-1 h-10 w-10 opacity-[0.07]"
            style={{ color }}
          />
          <p className="font-mono text-2xl font-bold leading-none" style={{ color }}>{count}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CategoryRail
// ---------------------------------------------------------------------------

function CategoryRail({
  categories,
  activeCategory,
  onSelect,
  dueItems,
}: {
  categories: typeof MEDICAL_CATEGORIES;
  activeCategory: MedicalCategory;
  onSelect: (c: MedicalCategory) => void;
  dueItems: MedicalRecord[];
}) {
  const now = Date.now();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      {categories.map(cat => {
        const config = CATEGORY_CONFIG[cat.category];
        if (!config) return null;
        const IconComponent = config.icon;
        const isActive = activeCategory === cat.category;

        const catDue = dueItems.filter(r => r.category === cat.category);
        const hasOverdue = catDue.some(r => r.nextDueDate! < now - dayMs);
        const hasSoon   = !hasOverdue && catDue.some(r => r.nextDueDate! < now + 7 * dayMs);
        const hasOk     = !hasOverdue && !hasSoon && catDue.length > 0;
        const dotColor  = hasOverdue ? '#EF4444' : hasSoon ? '#F59E0B' : hasOk ? '#22C55E' : null;

        return (
          <button
            key={cat.category}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(cat.category)}
            className={
              'shrink-0 flex flex-col items-center gap-1.5 rounded-2xl border transition-all w-[72px] sm:w-20 py-3 px-1' +
              (isActive ? '' : ' bg-card border-border/50 hover:border-border')
            }
            style={
              isActive
                ? { background: `${config.color}18`, borderColor: 'transparent' }
                : undefined
            }
          >
            <div className="relative">
              <IconComponent
                className={isActive ? 'h-5 w-5' : 'h-5 w-5 text-muted-foreground'}
                style={isActive ? { color: config.color } : undefined}
              />
              {dotColor && (
                <span
                  className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-background"
                  style={{ backgroundColor: dotColor }}
                />
              )}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide leading-none text-center">
              {config.shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CategorySection
// ---------------------------------------------------------------------------

function CategorySection({ dogId, category }: { dogId: string; category: MedicalCategory }) {
  const { records, loading, deleteRecord } = useMedical(dogId, category);
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MedicalRecord | null>(null);

  const config = CATEGORY_CONFIG[category];
  const IconComponent = config.icon;
  const color = config.color;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <IconComponent className="h-5 w-5" style={{ color }} />
          <h2 className="text-base font-bold tracking-tight">{config.longLabel}</h2>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add {config.longLabel.slice(0, -1)}</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Loading skeletons */}
      {loading ? (
        <div className="space-y-2 mt-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : records.length === 0 ? (
        /* Empty state */
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="mt-4 w-full flex flex-col items-center gap-3 py-12 rounded-2xl border-2 border-dashed border-border/40 hover:border-border/70 transition-colors text-center"
        >
          <IconComponent className="h-8 w-8" style={{ color: color + '60' }} />
          <span className="text-sm text-muted-foreground">No {config.longLabel.toLowerCase()} yet</span>
          <span className="text-xs text-muted-foreground/70">Tap to add a record</span>
        </button>
      ) : (
        /* Records list */
        <div className="mt-4 space-y-2">
          {records.map(r => (
            <MedicalRecordCard
              key={r.id}
              record={r}
              categoryColor={color}
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
            <DialogTitle>Add {config.longLabel}</DialogTitle>
          </DialogHeader>
          <MedicalRecordForm dogId={dogId} category={category} onSaved={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editRecord} onOpenChange={open => { if (!open) setEditRecord(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {config.longLabel}</DialogTitle>
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

// ---------------------------------------------------------------------------
// MedicalPage
// ---------------------------------------------------------------------------

export default function MedicalPage() {
  const { activeDog } = useDog();
  const [activeCategory, setActiveCategory] = useState<MedicalCategory>('vaccination');
  const dueItems = useUpcomingDue(activeDog?.id ?? '');

  if (!activeDog) return <div className="p-4 text-muted-foreground">No active dog selected.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4 px-4 sm:px-0 pb-[88px] sm:pb-4 pt-2">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Medical</h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">{activeDog.name}</p>
      </div>

      <HealthSummaryBar dueItems={dueItems} dogId={activeDog.id} />

      <CategoryRail
        categories={MEDICAL_CATEGORIES}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
        dueItems={dueItems}
      />

      <CategorySection
        dogId={activeDog.id}
        category={activeCategory}
      />
    </div>
  );
}
