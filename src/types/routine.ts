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
  walkDurationMin?: number;
  walkDistanceKm?: number;
  walkAvgSpeedKmh?: number;
  sleepDurationMin?: number;
  foodType?: string;
  foodAmountGrams?: number;
  waterAmountMl?: number;
}
