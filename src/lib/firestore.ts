import { collection } from 'firebase/firestore';
import { db } from './firebase';
import type { MedicalCategory } from '@/types';
import { MEDICAL_CATEGORIES } from './constants';

export const usersCol       = () => collection(db, 'users');
export const dogsCol        = () => collection(db, 'dogs');
export const publicCardsCol = () => collection(db, 'publicDogCards');

export const routinesCol  = (dogId: string) => collection(db, 'dogs', dogId, 'routines');
export const sessionsCol  = (dogId: string) => collection(db, 'dogs', dogId, 'trainingSessions');
export const templatesCol = (dogId: string) => collection(db, 'dogs', dogId, 'trainingTemplates');
export const humansCol    = (dogId: string) => collection(db, 'dogs', dogId, 'humans');
export const pendingCol   = (dogId: string) => collection(db, 'dogs', dogId, 'pendingHumans');
export const devicesCol   = (dogId: string) => collection(db, 'dogs', dogId, 'devices');

export const medicalCol = (dogId: string, category: MedicalCategory) => {
  const entry = MEDICAL_CATEGORIES.find(c => c.category === category)!;
  return collection(db, 'dogs', dogId, entry.collectionName);
};
