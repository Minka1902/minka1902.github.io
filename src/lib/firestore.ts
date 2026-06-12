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
export const businessDirectoryCol = () => collection(db, 'businessDirectory');
export const bizStaffCol        = (bid: string) => collection(db, 'businesses', bid, 'staff');
export const bizRolesCol        = (bid: string) => collection(db, 'businesses', bid, 'roles');
export const bizCustomersCol    = (bid: string) => collection(db, 'businesses', bid, 'customers');
export const bizPetsCol         = (bid: string) => collection(db, 'businesses', bid, 'pets');
export const bizAppointmentsCol = (bid: string) => collection(db, 'businesses', bid, 'appointments');
export const bizInvoicesCol     = (bid: string) => collection(db, 'businesses', bid, 'invoices');
export const bizProductsCol     = (bid: string) => collection(db, 'businesses', bid, 'products');
export const bizShipmentsCol    = (bid: string) => collection(db, 'businesses', bid, 'shipments');
export const bizOrdersCol       = (bid: string) => collection(db, 'businesses', bid, 'orders');
export const bizStaysCol        = (bid: string) => collection(db, 'businesses', bid, 'stays');
export const bizServicesCol     = (bid: string) => collection(db, 'businesses', bid, 'services');
export const bizShiftsCol       = (bid: string) => collection(db, 'businesses', bid, 'shifts');
export const bizTimeOffCol      = (bid: string) => collection(db, 'businesses', bid, 'timeOff');
export const bizSuppliersCol    = (bid: string) => collection(db, 'businesses', bid, 'suppliers');
export const bizPurchaseOrdersCol = (bid: string) => collection(db, 'businesses', bid, 'purchaseOrders');
export const bizThreadsCol      = (bid: string) => collection(db, 'businesses', bid, 'threads');
export const bizThreadMessagesCol = (bid: string, tid: string) => collection(db, 'businesses', bid, 'threads', tid, 'messages');
export const bizReportCardsCol  = (bid: string) => collection(db, 'businesses', bid, 'reportCards');
export const bizPackagesCol     = (bid: string) => collection(db, 'businesses', bid, 'packages');
export const bizCustomerPackagesCol = (bid: string) => collection(db, 'businesses', bid, 'customerPackages');
export const bizAdoptionListingsCol = (bid: string) => collection(db, 'businesses', bid, 'adoptionListings');
export const bizAdoptionApplicationsCol = (bid: string) => collection(db, 'businesses', bid, 'adoptionApplications');
export const bizChartEntriesCol = (bid: string) => collection(db, 'businesses', bid, 'chartEntries');
export const bizClassesCol      = (bid: string) => collection(db, 'businesses', bid, 'classes');
export const bizEnrollmentsCol  = (bid: string) => collection(db, 'businesses', bid, 'enrollments');
export const bizLittersCol      = (bid: string) => collection(db, 'businesses', bid, 'litters');
export const bizWaitlistCol     = (bid: string) => collection(db, 'businesses', bid, 'waitlist');

// Public subcollections of the directory entry — read by anyone, synced by staff.
export const directoryCatalogCol    = (bid: string) => collection(db, 'businessDirectory', bid, 'catalog');
export const directoryAdoptablesCol = (bid: string) => collection(db, 'businessDirectory', bid, 'adoptables');
export const directoryClassesCol    = (bid: string) => collection(db, 'businessDirectory', bid, 'classCatalog');
export const directoryLittersCol    = (bid: string) => collection(db, 'businessDirectory', bid, 'litterCatalog');
export const directoryReviewsCol    = (bid: string) => collection(db, 'businessDirectory', bid, 'reviews');
