import { useMemo } from 'react';
import { useRoutine } from '@/hooks/useRoutine';
import { useUpcomingDue } from '@/hooks/useMedical';
import { usePendingHumans } from '@/hooks/useHumans';
import { useScheduledLogs } from '@/hooks/useScheduledLogs';
import { useAuth } from '@/hooks/useAuth';
import { useDog } from '@/contexts/DogContext';
import type { Alert } from '@/types';

const EIGHT_HOURS = 8 * 60 * 60 * 1000;
const SEVEN_DAYS  = 7 * 24 * 60 * 60 * 1000;

export function useAlerts(dogId: string): Alert[] {
  const { todayLogs }   = useRoutine(dogId);
  const dueItems        = useUpcomingDue(dogId);
  const { pending }     = usePendingHumans(dogId);
  const { logs: scheduledLogs } = useScheduledLogs(dogId);
  const { user }        = useAuth();
  const { isMainHuman } = useDog();
  const now = Date.now();

  return useMemo(() => {
    if (!dogId) return [];
    const alerts: Alert[] = [];

    // Walk overdue
    const lastWalk = todayLogs
      .filter(l => l.type === 'walk')
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    if (!lastWalk || now - lastWalk.timestamp > EIGHT_HOURS) {
      alerts.push({
        id: 'walk_overdue', type: 'walk_overdue', dogId, severity: 'warning',
        message: 'No walk logged in the last 8 hours',
        actionRoute: '/routine', generatedAt: now,
      });
    }

    // No water today
    if (!todayLogs.some(l => l.type === 'drink')) {
      alerts.push({
        id: 'no_water', type: 'no_water_logged', dogId, severity: 'info',
        message: 'No water intake logged today',
        actionRoute: '/routine', generatedAt: now,
      });
    }

    // Medical due soon
    dueItems.forEach(item => {
      if (item.nextDueDate && item.nextDueDate <= now + SEVEN_DAYS) {
        const type = item.category === 'vaccination' ? 'vaccine_due'
                   : item.category === 'medication'  ? 'medication_due'
                   : item.category === 'flea_tick'   ? 'flea_tick_due'
                   : 'deworming_due';
        alerts.push({
          id: `med_${item.id}`, type, dogId,
          severity: item.nextDueDate <= now ? 'critical' : 'warning',
          message: `${item.title} is due ${item.nextDueDate <= now ? 'now' : 'soon'}`,
          actionRoute: '/medical', relatedId: item.id, generatedAt: now,
        });
      }
    });

    // Pending approvals (main human only)
    if (isMainHuman(dogId) && pending.length > 0) {
      alerts.push({
        id: 'pending', type: 'pending_approval', dogId, severity: 'info',
        message: `${pending.length} pending join request${pending.length > 1 ? 's' : ''}`,
        actionRoute: '/humans', generatedAt: now,
      });
    }

    // Scheduled tasks awaiting this user's approval
    const pendingScheduled = scheduledLogs.filter(
      l => l.assignedTo === user?.uid && l.status === 'pending_approval'
    );
    if (pendingScheduled.length > 0) {
      alerts.push({
        id: 'scheduled_approval_needed', type: 'scheduled_approval_needed', dogId,
        severity: 'warning',
        message: `${pendingScheduled.length} task${pendingScheduled.length > 1 ? 's' : ''} awaiting your approval`,
        actionRoute: '/routine', generatedAt: now,
      });
    }

    return alerts.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });
  }, [todayLogs, dueItems, pending, scheduledLogs, user?.uid, dogId, isMainHuman, now]);
}
