import { User } from '../models/user.model';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
}
