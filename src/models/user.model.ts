export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  password?: string;
  role?: UserRole;
  googleId?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

