import { Trash2, Pencil } from 'lucide-react';
import { fmtDate } from '@/lib/utils';
import type { MedicalRecord, Vaccination, Medication, Allergy, Diagnosis, Surgery, FleaTick } from '@/types';

interface Props {
  record: MedicalRecord;
  onDelete?: (id: string) => void;
  onEdit?: (record: MedicalRecord) => void;
  categoryColor?: string;
}

function getUrgency(record: MedicalRecord): 'overdue' | 'today' | 'soon' | 'ok' | 'none' {
  if (!record.nextDueDate) return 'none';
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  if (record.nextDueDate < now)         return 'overdue';
  if (record.nextDueDate < now + dayMs) return 'today';
  if (record.nextDueDate < now + 7 * dayMs) return 'soon';
  return 'ok';
}

const URGENCY_STYLES = {
  overdue: { badge: 'bg-red-500 text-white',                                       label: 'Overdue'    },
  today:   { badge: 'bg-amber-500 text-white',                                     label: 'Due today'  },
  soon:    { badge: 'bg-amber-400/20 text-amber-600 dark:text-amber-400',          label: 'Due soon'   },
  ok:      { badge: 'bg-green-500/10 text-green-600 dark:text-green-400',          label: 'Upcoming'   },
  none:    { badge: '',                                                              label: ''           },
};

export default function MedicalRecordCard({ record, onDelete, onEdit, categoryColor }: Props) {
  const urgency = getUrgency(record);
  const style = URGENCY_STYLES[urgency];

  return (
    <div className="group relative flex rounded-2xl border bg-card overflow-hidden transition-all hover:shadow-sm">
      {/* Left accent bar — 3px, category color */}
      <div className="w-[3px] shrink-0" style={{ backgroundColor: categoryColor ?? 'hsl(var(--border))' }} />

      {/* Content */}
      <div className="flex flex-col gap-1 px-3.5 py-3 flex-1 min-w-0">
        {/* Row 1: title + urgency badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug flex-1 min-w-0">{record.title}</p>
          {urgency !== 'none' && (
            <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${style.badge}`}>
              {style.label}
            </span>
          )}
        </div>

        {/* Row 2: dates + provider (monospace) */}
        <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap">
          <time dateTime={new Date(record.date).toISOString()} className="font-mono text-xs text-muted-foreground">
            {fmtDate(record.date)}
          </time>
          {record.nextDueDate && (
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <span>{'→'}</span>
              <time dateTime={new Date(record.nextDueDate).toISOString()}>
                {fmtDate(record.nextDueDate)}
              </time>
            </span>
          )}
          {record.provider && (
            <span className="text-xs text-muted-foreground">· {record.provider}</span>
          )}
        </div>

        {/* Row 3: category-specific detail */}
        {record.category === 'vaccination' && (record as Vaccination).vaccineName && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{(record as Vaccination).vaccineName}</span>
            {(record as Vaccination).batchNumber && <span> · Batch {(record as Vaccination).batchNumber}</span>}
          </p>
        )}
        {record.category === 'medication' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {(record as Medication).medicationName && (
              <span className="text-xs text-muted-foreground font-medium">{(record as Medication).medicationName}</span>
            )}
            {(record as Medication).dosage && (
              <span className="text-xs text-muted-foreground">· {(record as Medication).dosage}</span>
            )}
            {(record as Medication).isActive && (
              <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">Active</span>
            )}
          </div>
        )}
        {record.category === 'allergy' && (record as Allergy).allergen && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{(record as Allergy).allergen}</span>
            {(record as Allergy).severity && <span className="capitalize"> · {(record as Allergy).severity}</span>}
          </p>
        )}
        {record.category === 'diagnosis' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {(record as Diagnosis).condition && (
              <span className="text-xs text-muted-foreground font-medium">{(record as Diagnosis).condition}</span>
            )}
            {(record as Diagnosis).isActive && (
              <span className="text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">Active</span>
            )}
          </div>
        )}
        {record.category === 'surgery' && (record as Surgery).procedure && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{(record as Surgery).procedure}</span>
            {(record as Surgery).veterinarian && <span> · {(record as Surgery).veterinarian}</span>}
          </p>
        )}
        {(record.category === 'flea_tick' || record.category === 'deworming') && (record as FleaTick).productName && (
          <p className="text-xs text-muted-foreground">Product: <span className="font-medium">{(record as FleaTick).productName}</span></p>
        )}

        {/* Row 4: notes */}
        {record.notes && (
          <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-0.5">{record.notes}</p>
        )}

        {/* Row 4: action buttons */}
        {(onEdit || onDelete) && (
          <div className="flex items-center justify-end gap-0.5 mt-1">
            {/* On mobile: always visible. On desktop: only on hover. */}
            <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(record)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Edit record"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(record.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Delete record"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
