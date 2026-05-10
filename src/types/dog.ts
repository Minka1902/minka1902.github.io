export type HumanRole = 'caregiver' | 'trainer' | 'walker' | 'foster';

export interface FeedingEntry {
  time: string;   // "HH:mm"
  amount: string; // free text, e.g. "200g", "1 cup"
}

export interface QRVisibilityConfig {
  showAddress: boolean;
  showPhone: boolean;
  showRescueOrg: boolean;
  showMedicalAlerts: boolean;
}

export interface Dog {
  id: string;
  name: string;
  photoURL?: string;
  breed?: string;
  isMix: boolean;
  sex: 'male' | 'female' | 'unknown';
  weightKg?: number;
  chipId?: string;
  foodType?: string;
  feedings?: FeedingEntry[];
  behaviorNotes?: string;
  rescueOrg?: string;
  emergencyContact?: string;
  homeAddress?: string;
  mainHumanId: string;
  orgId?: string;
  qrPublic: boolean;
  qrVisibility: QRVisibilityConfig;
  createdAt: number;
  updatedAt: number;
}

export interface DogHuman {
  userId: string;
  displayName: string;
  email: string;
  role: HumanRole;
  approvedAt: number;
  approvedBy: string;
}

export interface PendingHuman {
  userId: string;
  displayName: string;
  email: string;
  requestedAt: number;
  requestedRole: HumanRole;
}
