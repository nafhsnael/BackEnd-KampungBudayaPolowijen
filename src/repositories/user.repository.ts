import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { User } from '../models/user.model';
import { IUserRepository } from './user.repository.interface';

/**
 * Tipe internal yang merepresentasikan baris dari tabel `users` di MySQL.
 * Kolom snake_case DB -> dipetakan ke camelCase model User.
 */
interface UserRow extends RowDataPacket {
  id:            string;
  email:         string;
  password_hash: string | null;
  full_name:     string;
  role:          'user' | 'admin';
  google_id:     string | null;
  avatar_url:    string | null;
  created_at:    Date;
  updated_at:    Date;
}

/** Map baris DB ke domain model User */
function mapRowToUser(row: UserRow): User {
  return {
    id:        row.id,
    email:     row.email,
    fullName:  row.full_name,
    password:  row.password_hash ?? undefined,
    role:      row.role,
    googleId:  row.google_id   ?? undefined,
    avatarUrl: row.avatar_url  ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserRepository implements IUserRepository {
  /**
   * Cari user berdasarkan email.
   * Query menggunakan parameterized statement -> aman dari SQL Injection.
   */
  async findByEmail(email: string): Promise<User | null> {
    const sql = `
      SELECT id, email, password_hash, full_name, role, google_id, avatar_url, created_at, updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await pool.query<UserRow[]>(sql, [email]);
    return rows.length > 0 ? mapRowToUser(rows[0]) : null;
  }

  /**
   * Cari user berdasarkan primary key ID.
   */
  async findById(id: string): Promise<User | null> {
    const sql = `
      SELECT id, email, password_hash, full_name, role, google_id, avatar_url, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query<UserRow[]>(sql, [id]);
    return rows.length > 0 ? mapRowToUser(rows[0]) : null;
  }

  /**
   * Cari user berdasarkan Google OAuth Subject ID.
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    const sql = `
      SELECT id, email, password_hash, full_name, role, google_id, avatar_url, created_at, updated_at
      FROM users
      WHERE google_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query<UserRow[]>(sql, [googleId]);
    return rows.length > 0 ? mapRowToUser(rows[0]) : null;
  }

  /**
   * Buat user baru di database.
   * ID di-generate di aplikasi menggunakan UUID v4.
   */
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newId = uuidv4();
    const sql = `
      INSERT INTO users (id, email, password_hash, full_name, role, google_id, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query<ResultSetHeader>(sql, [
      newId,
      userData.email,
      userData.password   ?? null,
      userData.fullName,
      userData.role       ?? 'user',
      userData.googleId   ?? null,
      userData.avatarUrl  ?? null,
    ]);

    // Ambil record yang baru dibuat untuk mendapatkan timestamp dari DB
    const created = await this.findById(newId);
    if (!created) {
      throw new Error('Failed to retrieve newly created user');
    }
    return created;
  }
}
