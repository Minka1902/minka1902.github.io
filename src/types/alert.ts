export type AlertType =
  | 'walk_overdue' | 'no_water_logged' | 'vaccine_due' | 'medication_due'
  | 'flea_tick_due' | 'deworming_due' | 'pending_approval' | 'scheduled_approval_needed'
  | 'tracker_battery_low' | 'tracker_disconnected';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  dogId: string;
  severity: AlertSeverity;
  message: string;
  actionRoute?: string;
  relatedId?: string;
  generatedAt: number;
}
