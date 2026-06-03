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

export const scheduledLogsCol    = (dogId: string) => collection(db, 'dogs', dogId, 'scheduledLogs');
export const trackingSessionsCol = (dogId: string) => collection(db, 'dogs', dogId, 'trackingSessions');

export const medicalCol = (dogId: string, category: MedicalCategory) => {
  const entry = MEDICAL_CATEGORIES.find(c => c.category === category)!;
  return collection(db, 'dogs', dogId, entry.collectionName);
};

// ─── Business CRM collections ────────────────────────────────────────────────
export const businessesCol      = () => collection(db, 'businesses');
export const bizStaffCol        = (bid: string) => collection(db, 'businesses', bid, 'staff');
export const bizRolesCol        = (bid: string) => collection(db, 'businesses', bid, 'roles');
export const bizCustomersCol    = (bid: string) => collection(db, 'businesses', bid, 'customers');
export const bizPetsCol         = (bid: string) => collection(db, 'businesses', bid, 'pets');
export const bizAppointmentsCol = (bid: string) => collection(db, 'businesses', bid, 'appointments');
export const bizInvoicesCol     = (bid: string) => collection(db, 'businesses', bid, 'invoices');
export const bizProductsCol     = (bid: string) => collection(db, 'businesses', bid, 'products');
export const bizShipmentsCol    = (bid: string) => collection(db, 'businesses', bid, 'shipments');
