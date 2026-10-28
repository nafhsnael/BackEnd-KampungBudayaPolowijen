import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/database';
import { storageService } from '../services/storage.service';
import { ApiResponse } from '../utils/response.util';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors/app.error';

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  role_title: string | null;
  role: string;
  status: string;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export class UserController {
  /**
   * Profil user yang sedang login
   * GET /api/users/profile
   */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) throw new UnauthorizedError();

      const [rows] = await pool.query<UserRow[]>(
        `SELECT id, email, full_name AS fullName, username, role_title AS roleTitle, 
                role, status, avatar_url AS avatarUrl, created_at AS createdAt, updated_at AS updatedAt 
         FROM users WHERE id = ?`,
        [userId]
      );

      if (rows.length === 0) throw new NotFoundError('User tidak ditemukan.');

      ApiResponse.success({
        res,
        message: 'Profil user berhasil diambil',
        data: rows[0],
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update profil user login
   * PUT /api/users/profile
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) throw new UnauthorizedError();

      const { fullName, username } = req.body;

      await pool.query<ResultSetHeader>(
        `UPDATE users SET full_name = COALESCE(?, full_name), username = COALESCE(?, username)
         WHERE id = ?`,
        [fullName || null, username || null, userId]
      );

      ApiResponse.success({
        res,
        message: 'Profil berhasil diperbarui',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload / Ganti Avatar user yang sedang login ke Vercel Blob Storage
   * POST /api/users/profile/avatar
   * Form-Data: avatar=<binary>
   */
  uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) throw new UnauthorizedError();

      if (!req.file) {
        throw new BadRequestError('File gambar avatar wajib disertakan pada field "avatar".');
      }

      // 1. Ambil data avatar lama user
      const [rows] = await pool.query<UserRow[]>(
        `SELECT id, avatar_url FROM users WHERE id = ?`,
        [userId]
      );

      if (rows.length === 0) throw new NotFoundError('User tidak ditemukan.');
      const oldAvatarUrl = rows[0].avatar_url;

      // 2. Upload avatar baru ke Vercel Blob Storage (folder 'avatars')
      const uploadResult = await storageService.uploadFile(req.file, {
        folder: 'avatars',
        filenamePrefix: `user-${userId}`,
      });

      // 3. Simpan URL publik Vercel Blob ke database MySQL
      await pool.query<ResultSetHeader>(
        `UPDATE users SET avatar_url = ? WHERE id = ?`,
        [uploadResult.url, userId]
      );

      // 4. Hapus file avatar lama dari Vercel Blob jika ada
      if (oldAvatarUrl && storageService.isBlobUrl(oldAvatarUrl)) {
        await storageService.deleteFile(oldAvatarUrl);
      }

      ApiResponse.success({
        res,
        message: 'Avatar berhasil diunggah ke Vercel Blob Storage',
        data: {
          avatarUrl: uploadResult.url,
          pathname: uploadResult.pathname,
          contentType: uploadResult.contentType,
          size: uploadResult.size,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();

