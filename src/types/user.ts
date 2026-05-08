export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  memberDogIds?: string[];
  createdAt: number;
  updatedAt: number;
}
