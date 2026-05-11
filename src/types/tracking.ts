import type { TrainingType } from './training';

export interface TrackPoint {
  lat: number;
  lng: number;
  timestamp: number;
  alt?: number;
  speed?: number; // m/s, calculated from adjacent points
}

export interface TargetLocation {
  id: string;
  lat: number;
  lng: number;
  name: string;
  description?: string;
  status: 'active' | 'found' | 'missed';
  foundAt?: number;
}

export interface TrackingSessionStats {
  handlerDistanceM: number;
  dogDistanceM: number;
  durationMs: number;
  maxHandlerSpeedKmh: number;
  avgHandlerSpeedKmh: number;
  maxDogSpeedKmh: number;
  avgDogSpeedKmh: number;
}

export interface TrackingSessionData {
  id: string;
  dogId: string;
  trainingType: TrainingType;
  createdBy: string;
  createdByName: string;
  startedAt: number;
  endedAt?: number;
  handlerTrack: TrackPoint[];
  dogTrack: TrackPoint[];
  targets: TargetLocation[];
  stats?: TrackingSessionStats;
  notes?: string;
}

export const TRACKING_TRAINING_TYPES: TrainingType[] = [
  'tracking', 'retrieve', 'search', 'scent_work',
];

export function isTrackingType(type: TrainingType): boolean {
  return TRACKING_TRAINING_TYPES.includes(type);
}
