export interface User {
  id: string;
  email: string;
  fullName: string;
  password?: string;
  googleId?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
