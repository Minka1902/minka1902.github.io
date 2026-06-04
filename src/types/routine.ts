export type RoutineType = 'sleep' | 'eat' | 'drink' | 'pee' | 'poop' | 'walk' | 'custom';
export type RoutineSource = 'manual' | 'device';

export interface RoutineLog {
  id: string;
  dogId: string;
  type: RoutineType;
  timestamp: number;
  loggedBy: string;
  loggedByName: string;
  source: RoutineSource;
  notes?: string;
  customLabel?: string;
  parentLogId?: string;
  walkDurationMin?: number;
  walkDistanceKm?: number;
  walkAvgSpeedKmh?: number;
  walkRoute?: { lat: number; lng: number }[]; // recorded GPS path of the walk

  sleepDurationMin?: number;
  foodType?: string;
  foodAmountGrams?: number;
  waterAmountMl?: number;
}

export type ScheduledLogStatus = 'pending_approval' | 'scheduled' | 'declined' | 'done' | 'skipped';

export interface ScheduledLog {
  id: string;
  dogId: string;
  type: RoutineType;
  scheduledFor: number;
  assignedTo: string;
  assignedToName: string;
  reason?: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  status: ScheduledLogStatus;
}
