export type TrainingType =
  | 'obedience' | 'agility' | 'scent_work' | 'tracking' | 'retrieve'
  | 'heel' | 'recall' | 'place_stay' | 'impulse_control' | 'cooperative_care'
  | 'socialization' | 'noise_desensitization' | 'crate_conditioning'
  | 'treadmill' | 'search' | 'bark_alert' | 'bite' | 'other';

export interface TrainingSessionExercise {
  name: string;
  reps?: number;
  durationMin?: number;
  notes?: string;
}

export interface TrainingSession {
  id: string;
  dogId: string;
  trainingType: TrainingType;
  trainerId: string;
  trainerName: string;
  handlerId?: string;
  handlerName?: string;
  scheduledAt: number;
  durationActualMin?: number;
  location?: string;
  objective: string;
  setup?: string;
  environment?: string;
  distractions?: string;
  equipment?: string;
  successCriteria?: string;
  result?: string;
  notes?: string;
  exercises: TrainingSessionExercise[];
  templateUsed: boolean;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface TrainingTemplate {
  id: string;
  dogId: string;
  trainingType: TrainingType;
  objective: string;
  setup?: string;
  environment?: string;
  distractions?: string;
  equipment?: string;
  successCriteria?: string;
  exercises: TrainingSessionExercise[];
  updatedAt: number;
}
