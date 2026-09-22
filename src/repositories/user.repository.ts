import { User } from '../models/user.model';
import { IUserRepository } from './user.repository.interface';
import { PasswordUtil } from '../utils/password.util';

export class UserRepository implements IUserRepository {
  private users: User[] = [];

  constructor() {
    this.seedMockUsers();
  }

  private async seedMockUsers(): Promise<void> {
    // Seed standard dummy user
    const defaultPasswordHash = await PasswordUtil.hash('password123');
    
    this.users.push({
      id: 'usr-001',
      email: 'user@example.com',
      fullName: 'Budi Santoso',
      password: defaultPasswordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.users.push({
      id: 'usr-002',
      email: 'googleuser@example.com',
      fullName: 'Siti Rahma',
      googleId: 'google-sub-id-123456',
      avatarUrl: 'https://lh3.googleusercontent.com/a/mock-photo',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    return user || null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const user = this.users.find((u) => u.googleId === googleId);
    return user || null;
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }
}
