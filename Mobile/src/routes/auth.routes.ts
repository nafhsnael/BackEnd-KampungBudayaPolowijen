import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { env } from '../config/env';
import { HttpError } from '../errors';
import { loginSchema, registerSchema } from '../dtos';
import { requireAuth } from '../middleware/auth';

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  full_name: string;
  password_hash: string | null;
  avatar_url: string | null;
  status: string;
}

const router = Router();

function publicUser(user: UserRow) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    photo_url: user.avatar_url,
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(input.password, 12);

    await pool.execute(
      `INSERT INTO users (id, email, password_hash, full_name, role, status)
       VALUES (?, ?, ?, ?, 'user', 'Aktif')`,
      [id, input.email, passwordHash, input.name],
    );

    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, email, full_name, password_hash, avatar_url, status FROM users WHERE id = ?',
      [id],
    );
    res.status(201).json({ data: { user: publicUser(rows[0]) } });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const [rows] = await pool.query<UserRow[]>(
      `SELECT id, email, full_name, password_hash, avatar_url, status
       FROM users WHERE email = ? LIMIT 1`,
      [input.email],
    );
    const user = rows[0];
    if (!user?.password_hash || !(await bcrypt.compare(input.password, user.password_hash))
      || user.status !== 'Aktif') {
      throw new HttpError(401, 'Email atau password salah');
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { subject: user.id, jwtid: randomUUID(), expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
    );
    res.json({ data: { user: publicUser(user), access_token: accessToken } });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const token = req.mobileUser;
    if (!token?.jti || !token.exp) throw new HttpError(401, 'Token autentikasi tidak valid');
    await pool.execute(
      `INSERT INTO revoked_tokens (token_id, expires_at) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
      [token.jti, new Date(token.exp * 1000)],
    );
    await pool.execute('DELETE FROM revoked_tokens WHERE expires_at <= CURRENT_TIMESTAMP');
    res.json({ data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
