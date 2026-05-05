export type RoutineType = 'sleep' | 'eat' | 'drink' | 'pee' | 'poop' | 'walk';
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
  walkDurationMin?: number;
  walkDistanceKm?: number;
  sleepDurationMin?: number;
  foodType?: string;
  foodAmountGrams?: number;
  waterAmountMl?: number;
}
