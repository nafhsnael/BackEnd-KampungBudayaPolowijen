import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { changePasswordSchema, profileSchema } from '../dtos';
import { HttpError } from '../errors';
import { requireAuth } from '../middleware/auth';
import { uploadProfilePhoto } from '../services/storage.service';

interface ProfileRow extends RowDataPacket {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  password_hash: string | null;
  created_at: Date;
}

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
    fields: 5,
    fieldSize: 64 * 1024,
    parts: 6,
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      callback(null, true);
      return;
    }
    callback(new HttpError(422, 'Foto harus berupa gambar JPG atau PNG', {
      photo: ['Format file harus JPG atau PNG'],
    }));
  },
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query<ProfileRow[]>(
      `SELECT id, email, full_name, avatar_url, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [req.mobileUser!.userId],
    );
    const user = rows[0];
    if (!user) throw new HttpError(404, 'User tidak ditemukan');
    res.json({
      data: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        photo_url: user.avatar_url,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/', requireAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const input = profileSchema.parse(req.body);
    if (input.name === undefined && !req.file) {
      throw new HttpError(422, 'Tidak ada data profil yang diperbarui', {
        name: ['Isi nama atau unggah foto profil'],
      });
    }
    const [rows] = await pool.query<ProfileRow[]>(
      'SELECT id, email, full_name, avatar_url, created_at FROM users WHERE id = ? LIMIT 1',
      [req.mobileUser!.userId],
    );
    const existing = rows[0];
    if (!existing) throw new HttpError(404, 'User tidak ditemukan');

    const photoUrl = req.file
      ? await uploadProfilePhoto(req.file, existing.id)
      : existing.avatar_url;
    await pool.execute(
      'UPDATE users SET full_name = ?, avatar_url = ? WHERE id = ?',
      [input.name ?? existing.full_name, photoUrl, existing.id],
    );
    res.json({
      data: {
        id: existing.id,
        name: input.name ?? existing.full_name,
        email: existing.email,
        photo_url: photoUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/password', requireAuth, async (req, res, next) => {
  try {
    const input = changePasswordSchema.parse(req.body);
    const [rows] = await pool.query<ProfileRow[]>(
      'SELECT id, email, full_name, avatar_url, password_hash, created_at FROM users WHERE id = ? LIMIT 1',
      [req.mobileUser!.userId],
    );
    const user = rows[0];
    if (!user) throw new HttpError(404, 'User tidak ditemukan');
    if (!user.password_hash || !(await bcrypt.compare(input.currentPassword, user.password_hash))) {
      throw new HttpError(422, 'Validasi gagal', { currentPassword: ['Password lama salah'] });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);
    res.json({ data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
