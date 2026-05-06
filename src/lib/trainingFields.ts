import type { TrainingType } from '@/types';

export type FieldInputType = 'text' | 'number' | 'boolean' | 'select';

export interface TrainingFieldDef {
  name: string;
  label: string;
  inputType: FieldInputType;
  options?: string[];
}

export const TRAINING_TYPE_FIELDS: Record<TrainingType, TrainingFieldDef[]> = {
  obedience: [
    { name: 'commandsFocused', label: 'Commands Focused On', inputType: 'text' },
    { name: 'offLeash', label: 'Off Leash', inputType: 'boolean' },
    { name: 'responseTime', label: 'Avg Response Time (sec)', inputType: 'number' },
  ],
  agility: [
    { name: 'obstaclesCompleted', label: 'Obstacles Completed', inputType: 'text' },
    { name: 'faultCount', label: 'Faults / Refusals', inputType: 'number' },
    { name: 'runTime', label: 'Course Time (sec)', inputType: 'number' },
  ],
  scent_work: [
    { name: 'targetOdor', label: 'Target Odor', inputType: 'select', options: ['birch', 'anise', 'clove', 'custom'] },
    { name: 'hideCount', label: 'Number of Hides', inputType: 'number' },
    { name: 'alertResponse', label: 'Alert Response Type', inputType: 'text' },
  ],
  tracking: [
    { name: 'trailAgeMin', label: 'Trail Age (min)', inputType: 'number' },
    { name: 'trailLengthM', label: 'Trail Length (m)', inputType: 'number' },
    { name: 'surfaceType', label: 'Surface Type', inputType: 'select', options: ['grass', 'concrete', 'mixed', 'woodland'] },
  ],
  retrieve: [
    { name: 'objectType', label: 'Object Retrieved', inputType: 'text' },
    { name: 'releaseQuality', label: 'Release Quality', inputType: 'select', options: ['soft', 'medium', 'hard', 'refusal'] },
    { name: 'distanceM', label: 'Distance (m)', inputType: 'number' },
  ],
  heel: [
    { name: 'heelPosition', label: 'Heel Position', inputType: 'select', options: ['left', 'right', 'variable'] },
    { name: 'onLeash', label: 'On Leash', inputType: 'boolean' },
    { name: 'pace', label: 'Pace Variation', inputType: 'select', options: ['slow', 'normal', 'fast', 'mixed'] },
  ],
  recall: [
    { name: 'recallCue', label: 'Recall Cue Used', inputType: 'text' },
    { name: 'distanceM', label: 'Distance (m)', inputType: 'number' },
    { name: 'responseSpeed', label: 'Response Speed', inputType: 'select', options: ['immediate', 'delayed', 'ignored'] },
  ],
  place_stay: [
    { name: 'placeName', label: 'Place / Location', inputType: 'text' },
    { name: 'durationSec', label: 'Hold Duration (sec)', inputType: 'number' },
    { name: 'releasedOnCue', label: 'Released on Cue', inputType: 'boolean' },
  ],
  impulse_control: [
    { name: 'exerciseType', label: 'Exercise Type', inputType: 'select', options: ['leave it', 'wait', 'threshold work', 'relaxation protocol'] },
    { name: 'delaySec', label: 'Delay / Hold (sec)', inputType: 'number' },
    { name: 'rewardTiming', label: 'Reward Timing', inputType: 'select', options: ['immediate', 'delayed', 'variable'] },
  ],
  cooperative_care: [
    { name: 'careType', label: 'Care Activity', inputType: 'select', options: ['grooming', 'nail trim', 'vet exam', 'bathing', 'handling'] },
    { name: 'anxietyLevel', label: 'Anxiety Level', inputType: 'select', options: ['none', 'low', 'moderate', 'high'] },
    { name: 'protocolStep', label: 'Protocol / Desensitization Step', inputType: 'text' },
  ],
  socialization: [
    { name: 'exposureType', label: 'Exposure Type', inputType: 'select', options: ['dogs', 'people', 'environment', 'sounds', 'mixed'] },
    { name: 'noveltyLevel', label: 'Novelty Level', inputType: 'select', options: ['familiar', 'somewhat new', 'brand new'] },
    { name: 'reactionQuality', label: "Dog's Reaction", inputType: 'select', options: ['positive', 'neutral', 'cautious', 'fearful'] },
  ],
  noise_desensitization: [
    { name: 'noiseType', label: 'Noise Type', inputType: 'text' },
    { name: 'volumeLevel', label: 'Volume Level (1–10)', inputType: 'number' },
    { name: 'reactionLevel', label: 'Reaction Level', inputType: 'select', options: ['no response', 'alert', 'anxious', 'panicked'] },
  ],
  crate_conditioning: [
    { name: 'durationMin', label: 'Time in Crate (min)', inputType: 'number' },
    { name: 'doorClosed', label: 'Door Closed', inputType: 'boolean' },
    { name: 'comportment', label: 'Behavior in Crate', inputType: 'select', options: ['relaxed', 'alert', 'anxious', 'destructive'] },
  ],
  treadmill: [
    { name: 'speedKmh', label: 'Speed (km/h)', inputType: 'number' },
    { name: 'durationMin', label: 'Duration (min)', inputType: 'number' },
    { name: 'inclinePct', label: 'Incline (%)', inputType: 'number' },
  ],
  search: [
    { name: 'searchArea', label: 'Search Area', inputType: 'text' },
    { name: 'targetFound', label: 'Target Found', inputType: 'boolean' },
    { name: 'searchTimeMin', label: 'Search Duration (min)', inputType: 'number' },
  ],
  bark_alert: [
    { name: 'alertCue', label: 'Alert Cue Type', inputType: 'select', options: ['bark', 'nose touch', 'down', 'other'] },
    { name: 'indicationQuality', label: 'Indication Quality', inputType: 'select', options: ['sharp', 'clear', 'intermittent', 'unclear'] },
    { name: 'falseAlerts', label: 'False Alerts', inputType: 'number' },
  ],
  bite: [
    { name: 'biteType', label: 'Bite Type', inputType: 'select', options: ['grip', 'release', 'redirection'] },
    { name: 'targetZone', label: 'Target Zone / Sleeve', inputType: 'text' },
    { name: 'releaseResponse', label: 'Release Command Response', inputType: 'select', options: ['immediate', 'delayed', 'requires physical'] },
  ],
  other: [
    { name: 'customFocus', label: 'Training Focus', inputType: 'text' },
    { name: 'goalMet', label: 'Goal Achieved', inputType: 'boolean' },
  ],
};
