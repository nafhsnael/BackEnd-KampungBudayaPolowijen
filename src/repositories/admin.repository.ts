import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { ConflictError, NotFoundError } from '../errors/app.error';
import { UserRole, UserStatus } from '../models/user.model';

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  role_title: string | null;
  role: UserRole;
  status: UserStatus;
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

export interface AdminUserItem {
  id: string;
  role: string;
  roleTitle?: string;
  fullName: string;
  email: string;
  username: string;
  access: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

function mapUser(row: UserRow): AdminUserItem {
  return {
    id: row.id,
    role: row.role_title || row.full_name || (row.role === 'admin' ? 'Super Admin' : 'User'),
    roleTitle: row.role_title ?? (row.role === 'admin' ? 'Super Admin' : 'User'),
    fullName: row.full_name,
    email: row.email,
    username: row.username || row.email.split('@')[0],
    access: row.role,
    status: row.status ?? 'Aktif',
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
    throw new ConflictError('User dengan email atau username ini sudah terdaftar');
  }
  throw error;
}

export class AdminRepository {
  async listUsers(filters: {
    search?: string;
    role?: string;
    access?: UserRole;
    status?: string;
    page: number;
    limit: number;
  }): Promise<{ users: AdminUserItem[]; total: number }> {
    const clauses: string[] = [];
    const values: (string | number)[] = [];

    if (filters.access) {
      clauses.push('role = ?');
      values.push(filters.access);
    }

    if (filters.status && filters.status !== 'Semua') {
      clauses.push('status = ?');
      values.push(filters.status);
    }

    if (filters.role && filters.role !== 'Semua') {
      clauses.push('(role_title LIKE ? OR role = ?)');
      values.push(`%${filters.role}%`, filters.role);
    }

    if (filters.search) {
      clauses.push('(full_name LIKE ? OR email LIKE ? OR username LIKE ? OR role_title LIKE ?)');
      const term = `%${filters.search}%`;
      values.push(term, term, term, term);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [countRows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM users ${where}`,
      values
    );

    const offset = (filters.page - 1) * filters.limit;
    const [rows] = await pool.query<UserRow[]>(
      `SELECT id, email, full_name, username, role_title, role, status, avatar_url, created_at, updated_at
       FROM users ${where}
       ORDER BY 
         CASE WHEN id REGEXP '^[0-9]+$' THEN CAST(id AS UNSIGNED) ELSE 999999 END ASC,
         created_at ASC
       LIMIT ? OFFSET ?`,
      [...values, filters.limit, offset]
    );

    return { users: rows.map(mapUser), total: countRows[0].total };
  }

  async findUser(id: string): Promise<AdminUserItem> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT id, email, full_name, username, role_title, role, status, avatar_url, created_at, updated_at
       FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!rows[0]) throw new NotFoundError('User not found');
    return mapUser(rows[0]);
  }

  async createUser(user: {
    email: string;
    fullName?: string;
    username?: string;
    roleTitle?: string;
    role?: string;
    access?: UserRole;
    status?: UserStatus;
    passwordHash: string;
    avatarUrl?: string | null;
  }): Promise<AdminUserItem> {
    const id = uuidv4();
    const systemRole: UserRole = user.access ?? (user.role === 'admin' ? 'admin' : 'user');
    const roleTitle = user.roleTitle ?? user.role ?? (systemRole === 'admin' ? 'Super Admin' : 'User');
    const fullName = user.fullName ?? roleTitle;
    const username = user.username ?? user.email.split('@')[0];
    const status: UserStatus = user.status ?? 'Aktif';

    try {
      await pool.query<ResultSetHeader>(
        `INSERT INTO users (id, email, password_hash, full_name, username, role_title, role, status, avatar_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, user.email, user.passwordHash, fullName, username, roleTitle, systemRole, status, user.avatarUrl ?? null]
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
      username?: string;
      roleTitle?: string;
      role?: string;
      access?: UserRole;
      status?: UserStatus;
      passwordHash?: string;
      avatarUrl?: string | null;
    }
  ): Promise<AdminUserItem> {
    const dbUpdates: Record<string, string | null | undefined> = {};

    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.username !== undefined) dbUpdates.username = updates.username;

    // FE sends role = "Super Admin" / "Manajer UMKM", map to role_title
    if (updates.roleTitle !== undefined) {
      dbUpdates.role_title = updates.roleTitle;
    } else if (updates.role !== undefined) {
      // If role is sent as string title:
      dbUpdates.role_title = updates.role;
      if (!updates.fullName) {
        dbUpdates.full_name = updates.role;
      }
    }

    if (updates.access !== undefined) {
      dbUpdates.role = updates.access;
    } else if (updates.role === 'admin' || updates.role === 'user') {
      dbUpdates.role = updates.role;
    }

    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.passwordHash !== undefined) dbUpdates.password_hash = updates.passwordHash;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

    const entries = Object.entries(dbUpdates).filter(([, value]) => value !== undefined);
    if (entries.length > 0) {
      try {
        const [result] = await pool.query<ResultSetHeader>(
          `UPDATE users SET ${entries.map(([key]) => `${key} = ?`).join(', ')}
           WHERE id = ?`,
          [...entries.map(([, value]) => value), id]
        );
        if (result.affectedRows === 0) {
          // Check if user exists
          await this.findUser(id);
        }
      } catch (error) {
        throwIfDuplicate(error);
      }
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
