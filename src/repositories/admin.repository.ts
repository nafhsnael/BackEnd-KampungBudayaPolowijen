import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { ConflictError, NotFoundError } from '../errors/app.error';
import { User, UserRole } from '../models/user.model';

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface TableRow extends RowDataPacket {
  table_name: string;
  has_active_column: number;
}

function mapUser(row: UserRow): Omit<User, 'password' | 'googleId'> {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function throwIfDuplicate(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ER_DUP_ENTRY'
  ) {
    throw new ConflictError('A user with this email already exists');
  }
  throw error;
}

export class AdminRepository {
  async listUsers(filters: {
    search?: string;
    role?: UserRole;
    page: number;
    limit: number;
  }): Promise<{ users: Omit<User, 'password' | 'googleId'>[]; total: number }> {
    const clauses: string[] = [];
    const values: (string | number)[] = [];
    if (filters.role) {
      clauses.push('role = ?');
      values.push(filters.role);
    }
    if (filters.search) {
      clauses.push('(full_name LIKE ? OR email LIKE ?)');
      values.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [countRows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM users ${where}`,
      values
    );
    const offset = (filters.page - 1) * filters.limit;
    const [rows] = await pool.query<UserRow[]>(
      `SELECT id, email, full_name, role, avatar_url, created_at, updated_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, filters.limit, offset]
    );
    return { users: rows.map(mapUser), total: countRows[0].total };
  }

  async findUser(id: string): Promise<Omit<User, 'password' | 'googleId'>> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT id, email, full_name, role, avatar_url, created_at, updated_at
       FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!rows[0]) throw new NotFoundError('User not found');
    return mapUser(rows[0]);
  }

  async createUser(user: {
    email: string;
    fullName: string;
    role: UserRole;
    passwordHash: string;
    avatarUrl?: string | null;
  }): Promise<Omit<User, 'password' | 'googleId'>> {
    const id = uuidv4();
    try {
      await pool.query<ResultSetHeader>(
        `INSERT INTO users (id, email, password_hash, full_name, role, avatar_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, user.email, user.passwordHash, user.fullName, user.role, user.avatarUrl ?? null]
      );
    } catch (error) {
      throwIfDuplicate(error);
    }
    return this.findUser(id);
  }

  async updateUser(
    id: string,
    updates: {
      email?: string;
      fullName?: string;
      role?: UserRole;
      passwordHash?: string;
      avatarUrl?: string | null;
    }
  ): Promise<Omit<User, 'password' | 'googleId'>> {
    const columns: Record<string, string> = {
      email: 'email',
      fullName: 'full_name',
      role: 'role',
      passwordHash: 'password_hash',
      avatarUrl: 'avatar_url',
    };
    const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
    try {
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE users SET ${entries.map(([key]) => `${columns[key]} = ?`).join(', ')}
         WHERE id = ?`,
        [...entries.map(([, value]) => value), id]
      );
      if (result.affectedRows === 0) {
        const existing = await this.findUser(id);
        return existing;
      }
    } catch (error) {
      throwIfDuplicate(error);
    }
    return this.findUser(id);
  }

  async deleteUser(id: string): Promise<void> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) throw new NotFoundError('User not found');
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalUmkm: number | null;
    totalEvents: number | null;
    activePackages: number | null;
  }> {
    const [users] = await pool.query<CountRow[]>(
      'SELECT COUNT(*) AS total FROM users'
    );
    const [tables] = await pool.query<TableRow[]>(
      `SELECT table_name,
              MAX(column_name = 'is_active') AS has_active_column
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name IN ('umkm', 'events', 'packages')
       GROUP BY table_name`
    );
    const existing = new Map(tables.map((row) => [row.table_name, row]));
    const countTable = async (table: string, activeOnly = false): Promise<number | null> => {
      const metadata = existing.get(table);
      if (!metadata || (activeOnly && !metadata.has_active_column)) return null;
      const condition = activeOnly ? ' WHERE is_active = 1' : '';
      const [rows] = await pool.query<CountRow[]>(
        `SELECT COUNT(*) AS total FROM \`${table}\`${condition}`
      );
      return rows[0].total;
    };

    const [totalUmkm, totalEvents, activePackages] = await Promise.all([
      countTable('umkm'),
      countTable('events'),
      countTable('packages', true),
    ]);
    return { totalUsers: users[0].total, totalUmkm, totalEvents, activePackages };
  }
}
