export type UserRole = 'user' | 'admin';
export type UserStatus = 'Aktif' | 'Suspended';

export interface User {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  roleTitle?: string;
  role?: UserRole;
  access?: UserRole;
  status?: UserStatus;
  password?: string;
  googleId?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
