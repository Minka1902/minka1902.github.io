export type OrgType = 'rescue' | 'shelter' | 'breeder' | 'training' | 'daycare' | 'other';
export type OrgMemberRole = 'admin' | 'member';

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
  adminUserIds: string[];
  memberUserIds: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface OrgMember {
  userId: string;
  displayName: string;
  email: string;
  role: OrgMemberRole;
  joinedAt: number;
  invitedBy?: string;
}

export interface PendingOrgMember {
  userId: string;
  displayName: string;
  email: string;
  requestedAt: number;
}
