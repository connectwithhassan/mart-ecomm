export type UserRole = 'customer' | 'seller' | 'staff' | 'super_admin';

export type UserStatus = 'active' | 'suspended' | 'pending_verification';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string | null;
  preferredCurrency: string;
  preferredLanguage: string;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserJWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  sellerId?: string | null;
  jti?: string;
  iat?: number;
  exp?: number;
}
