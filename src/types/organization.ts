// ─── Org-level enums ──────────────────────────────────────────────────────────

export type OrgType =
  | 'rescue' | 'shelter' | 'breeder' | 'training'
  | 'daycare' | 'spa' | 'veterinary' | 'boarding' | 'other';

/** 'admin' = can manage members/dogs/tasks. 'staff' = operational role. Head is tracked separately via headUserId. */
export type OrgMemberRole = 'admin' | 'staff';

export type OrgStaffRole =
  | 'manager' | 'groomer' | 'trainer' | 'walker'
  | 'daycare_staff' | 'vet_tech' | 'receptionist' | 'behavior_specialist' | 'other';

export type OrgServiceType =
  | 'grooming' | 'training' | 'daycare' | 'boarding'
  | 'walking' | 'rehabilitation' | 'vet_care' | 'spa' | 'other';

export type OrgTaskType =
  | 'grooming' | 'bath' | 'nail_trim' | 'dental' | 'ear_clean'
  | 'training' | 'walk' | 'feeding' | 'medication' | 'vet_visit'
  | 'behavior_check' | 'socialization' | 'other';

export type OrgTaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';

export type DogMood = 'great' | 'good' | 'okay' | 'anxious' | 'tired' | 'sick';

// ─── Core org document ────────────────────────────────────────────────────────

export interface OrgAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface Organization {
  id: string;
  name: string;
  logoURL?: string;
  description?: string;
  type?: OrgType;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  address?: OrgAddress;
  /** The org creator (and sole person who can promote/demote admins). */
  headUserId: string;
  /** Admins — can manage members, enrolled dogs, and tasks. */
  adminUserIds: string[];
  /** Operational staff — can view enrolled dogs and complete assigned tasks. */
  staffUserIds: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Members ─────────────────────────────────────────────────────────────────

export interface OrgMember {
  userId: string;
  displayName: string;
  email: string;
  role: OrgMemberRole;
  /** Specific job function for staff members. */
  staffRole?: OrgStaffRole;
  joinedAt: number;
  invitedBy?: string;
}

export interface PendingOrgMember {
  userId: string;
  displayName: string;
  email: string;
  requestedAt: number;
}

// ─── Enrolled dogs ────────────────────────────────────────────────────────────

export interface OrgStaffAssignment {
  userId: string;
  displayName: string;
  staffRole: OrgStaffRole;
  assignedAt: number;
  assignedBy: string;
}

/** Stored at /organizations/{orgId}/enrolledDogs/{dogId} */
export interface OrgEnrolledDog {
  dogId: string;
  dogName: string;
  dogPhotoURL?: string;
  mainHumanId: string;
  mainHumanName: string;
  mainHumanEmail: string;
  mainHumanPhone?: string;
  enrolledAt: number;
  enrolledBy: string;
  status: 'active' | 'paused' | 'inactive';
  checkedIn: boolean;
  checkedInAt?: number;
  checkedInBy?: string;
  checkedOutAt?: number;
  assignedStaff: OrgStaffAssignment[];
  serviceTypes: OrgServiceType[];
  orgNotes?: string;
  specialCareNotes?: string;
  internalTags?: string[];
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

/** Stored at /organizations/{orgId}/tasks/{taskId} */
export interface OrgTask {
  id: string;
  dogId: string;
  dogName: string;
  title: string;
  type: OrgTaskType;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  assignedByName: string;
  dueAt?: number;
  status: OrgTaskStatus;
  notes?: string;
  completedAt?: number;
  completedByName?: string;
  completionNotes?: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Daily report cards ───────────────────────────────────────────────────────

/** Stored at /organizations/{orgId}/dailyReports/{reportId} */
export interface OrgDailyReport {
  id: string;
  dogId: string;
  dogName: string;
  date: string; // YYYY-MM-DD
  summary: string;
  mood: DogMood;
  activities: string[];
  staffId: string;
  staffName: string;
  createdAt: number;
}
