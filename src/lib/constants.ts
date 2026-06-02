import type { RoutineType, TrainingType, HumanRole, MedicalCategory } from '@/types';

export const ROUTINE_TYPES: { type: RoutineType; label: string; icon: string; color: string }[] = [
  { type: 'walk',   label: 'Walk',   icon: '🐾', color: '#F59E0B' },
  { type: 'eat',    label: 'Ate',    icon: '🍖', color: '#10B981' },
  { type: 'drink',  label: 'Water',  icon: '💧', color: '#3B82F6' },
  { type: 'custom', label: 'Custom', icon: '✏️', color: '#F97316' },
];

export const QUICK_LOG_TYPES = ROUTINE_TYPES;

// Colors for pee/poop — logged only from walk summary, not in ROUTINE_TYPES
export const PEE_COLOR  = '#84CC16';
export const POOP_COLOR = '#473c48';

export const TRAINING_TYPES: { type: TrainingType; label: string }[] = [
  { type: 'obedience',             label: 'Obedience' },
  { type: 'agility',               label: 'Agility' },
  { type: 'scent_work',            label: 'Scent Work' },
  { type: 'tracking',              label: 'Tracking & Trailing' },
  { type: 'retrieve',              label: 'Retrieve' },
  { type: 'heel',                  label: 'Heel / Obedience Walk' },
  { type: 'recall',                label: 'Recall & Distraction' },
  { type: 'place_stay',            label: 'Place / Stay / Settle' },
  { type: 'impulse_control',       label: 'Impulse Control' },
  { type: 'cooperative_care',      label: 'Cooperative Care' },
  { type: 'socialization',         label: 'Social Neutrality' },
  { type: 'noise_desensitization', label: 'Noise Desensitization' },
  { type: 'crate_conditioning',    label: 'Crate Conditioning' },
  { type: 'treadmill',             label: 'Treadmill' },
  { type: 'search',                label: 'Area Search' },
  { type: 'bark_alert',            label: 'Bark Alert' },
  { type: 'bite',                  label: 'Bite Work' },
  { type: 'other',                 label: 'Other' },
];

export const HUMAN_ROLES: { role: HumanRole; label: string }[] = [
  { role: 'caregiver', label: 'Caregiver' },
  { role: 'trainer',   label: 'Trainer' },
  { role: 'walker',    label: 'Walker' },
  { role: 'foster',    label: 'Foster' },
];

export const MEDICAL_CATEGORY_META: Record<string, { icon: string; color: string }> = {
  vaccination: { icon: '💉', color: '#6366F1' },
  medication:  { icon: '💊', color: '#EC4899' },
  flea_tick:   { icon: '🐜', color: '#14B8A6' },
  deworming:   { icon: '🪱', color: '#8B5CF6' },
  allergy:     { icon: '⚠️', color: '#F97316' },
  diagnosis:   { icon: '🩺', color: '#EF4444' },
  surgery:     { icon: '🔬', color: '#64748B' },
};

export const MEDICAL_CATEGORIES: { category: MedicalCategory; label: string; collectionName: string }[] = [
  { category: 'vaccination', label: 'Vaccinations',  collectionName: 'medicalVaccinations' },
  { category: 'medication',  label: 'Medications',   collectionName: 'medicalMedications' },
  { category: 'flea_tick',   label: 'Flea & Tick',   collectionName: 'medicalFleaTick' },
  { category: 'deworming',   label: 'Deworming',     collectionName: 'medicalDeworming' },
  { category: 'allergy',     label: 'Allergies',     collectionName: 'medicalAllergies' },
  { category: 'diagnosis',   label: 'Diagnoses',     collectionName: 'medicalDiagnoses' },
  { category: 'surgery',     label: 'Surgeries',     collectionName: 'medicalSurgeries' },
];
