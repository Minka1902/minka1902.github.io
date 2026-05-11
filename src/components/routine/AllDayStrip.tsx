import { MEDICAL_CATEGORY_META } from '@/lib/constants';
import type { MedicalCalendarEvent } from '@/hooks/useMedical';

interface Props {
  events: MedicalCalendarEvent[];
  onEventClick?: (event: MedicalCalendarEvent) => void;
}

export default function AllDayStrip({ events, onEventClick }: Props) {
  if (events.length === 0) return null;
  return (
    <div className="flex gap-1.5 flex-wrap px-3 py-2 border-b border-border/30 bg-muted/20 shrink-0">
      {events.map((evt, i) => {
        const meta = MEDICAL_CATEGORY_META[evt.record.category] ?? { icon: '🏥', color: '#6366F1' };
        const isDue = evt.eventType === 'due';
        return (
          <button
            key={`${evt.record.id}-${evt.eventType}-${i}`}
            onClick={() => onEventClick?.(evt)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-opacity hover:opacity-80 active:opacity-60"
            style={{
              backgroundColor: meta.color + '18',
              color: meta.color,
              border: `1px ${isDue ? 'dashed' : 'solid'} ${meta.color}${isDue ? '60' : '30'}`,
            }}
          >
            <span aria-hidden="true">{meta.icon}</span> {evt.record.title}
            {isDue && <span className="ml-0.5 opacity-70">· due</span>}
          </button>
        );
      })}
    </div>
  );
}
