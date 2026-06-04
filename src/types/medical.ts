export type MedicalCategory =
  | 'vaccination' | 'medication' | 'flea_tick' | 'deworming'
  | 'allergy' | 'diagnosis' | 'surgery';

interface MedicalBase {
  id: string;
  dogId: string;
  category: MedicalCategory;
  title: string;
  date: number;
  nextDueDate?: number;
  provider?: string;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedAt: number;
}

export interface Vaccination extends MedicalBase {
  category: 'vaccination';
  vaccineName: string;
  batchNumber?: string;
}
export interface Medication extends MedicalBase {
  category: 'medication';
  medicationName: string;
  dosage?: string;
  frequency?: string;
  isActive: boolean;
  endDate?: number;               // course end — after this the medication auto-finishes
  administrationTimes?: string[]; // HH:MM strings, e.g. ['08:00', '20:00']
}
export interface FleaTick extends MedicalBase { category: 'flea_tick'; productName?: string; }
export interface Deworming extends MedicalBase { category: 'deworming'; productName?: string; }
export interface Allergy extends MedicalBase {
  category: 'allergy';
  allergen: string;
  severity?: 'mild' | 'moderate' | 'severe';
}
export interface Diagnosis extends MedicalBase {
  category: 'diagnosis';
  condition: string;
  isActive: boolean;
}
export interface Surgery extends MedicalBase {
  category: 'surgery';
  procedure: string;
  veterinarian?: string;
}
export type MedicalRecord = Vaccination | Medication | FleaTick | Deworming | Allergy | Diagnosis | Surgery;

/** A medication is "finished" once its course end date has passed. */
export function isMedicationFinished(med: Pick<Medication, 'endDate'>): boolean {
  return med.endDate !== undefined && med.endDate < Date.now();
}
