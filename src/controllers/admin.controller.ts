import { NextFunction, Request, Response } from 'express';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/app.error';
import { AdminRepository } from '../repositories/admin.repository';
import { PasswordUtil } from '../utils/password.util';
import { ApiResponse } from '../utils/response.util';
import { storageService } from '../services/storage.service';
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserListQuerySchema,
} from '../dtos/admin.dto';
import { parseValidatedInput } from '../utils/validation.util';

export class AdminController {
  constructor(private readonly repository = new AdminRepository()) {}

  dashboardStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      ApiResponse.success({
        res,
        message: 'Dashboard statistics retrieved',
        data: await this.repository.getDashboardStats(),
      });
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = parseValidatedInput(UserListQuerySchema, req.query);
      const result = await this.repository.listUsers(query);
      ApiResponse.success({
        res,
        message: 'Users retrieved',
        data: {
          ...result,
          pagination: {
            page: query.page,
            limit: query.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / query.limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      ApiResponse.success({
        res,
        message: 'User retrieved',
        data: await this.repository.findUser(req.params.id),
      });
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = parseValidatedInput(CreateUserSchema, req.body);

      let avatarUrl = parsed.avatarUrl;

      // Jika ada file avatar di-upload bersamaan via multipart form-data
      if (req.file) {
        const uploaded = await storageService.uploadFile(req.file, {
          folder: 'avatars',
          filenamePrefix: 'avatar',
        });
        avatarUrl = uploaded.url;
      }

      const { password, ...user } = parsed;
      const created = await this.repository.createUser({
        ...user,
        avatarUrl,
        passwordHash: await PasswordUtil.hash(password),
      });

      ApiResponse.success({
        res,
        statusCode: 201,
        message: 'User created successfully',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = parseValidatedInput(UpdateUserSchema, req.body);

      if (req.params.id === req.auth?.userId && (parsed.role === 'user' || parsed.access === 'user')) {
        throw new ForbiddenError('You cannot remove your own administrator access');
      }

      // Ambil data user eksisting untuk memeriksa avatar lama
      const existingUser = await this.repository.findUser(req.params.id);

      let avatarUrl = parsed.avatarUrl;

      // Jika ada file avatar baru yang di-upload
      if (req.file) {
        const uploaded = await storageService.uploadFile(req.file, {
          folder: 'avatars',
          filenamePrefix: `user-${req.params.id}`,
        });
        avatarUrl = uploaded.url;

        // Hapus avatar lama dari Vercel Blob jika ada
        if (existingUser.avatarUrl && storageService.isBlobUrl(existingUser.avatarUrl)) {
          await storageService.deleteFile(existingUser.avatarUrl);
        }
      } else if (avatarUrl !== undefined && avatarUrl !== existingUser.avatarUrl) {
        // Jika avatarUrl di-update via payload JSON ke URL berbeda atau null, hapus file lama
        if (existingUser.avatarUrl && storageService.isBlobUrl(existingUser.avatarUrl)) {
          await storageService.deleteFile(existingUser.avatarUrl);
        }
      }

      const { password, ...fields } = parsed;
      const updated = await this.repository.updateUser(req.params.id, {
        ...fields,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(password ? { passwordHash: await PasswordUtil.hash(password) } : {}),
      });

      ApiResponse.success({ res, message: 'User updated successfully', data: updated });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint khusus upload avatar user
   * Route: POST /api/admin/users/:id/avatar
   */
  uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('File gambar avatar wajib disertakan.');
      }

      const user = await this.repository.findUser(req.params.id);
      if (!user) {
        throw new NotFoundError('User tidak ditemukan.');
      }

      // Upload ke Vercel Blob Storage di folder 'avatars'
      const uploadResult = await storageService.uploadFile(req.file, {
        folder: 'avatars',
        filenamePrefix: `user-${user.id}`,
      });

      // Hapus avatar lama jika tersimpan di Vercel Blob
      if (user.avatarUrl && storageService.isBlobUrl(user.avatarUrl)) {
        await storageService.deleteFile(user.avatarUrl);
      }

      // Simpan URL Vercel Blob ke database MySQL
      const updated = await this.repository.updateUser(user.id, {
        avatarUrl: uploadResult.url,
      });

      ApiResponse.success({
        res,
        message: 'Avatar user berhasil diperbarui di Vercel Blob Storage',
        data: {
          user: updated,
          avatarUrl: uploadResult.url,
          pathname: uploadResult.pathname,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.params.id === req.auth?.userId) {
        throw new ForbiddenError('You cannot delete your own account');
      }

      const user = await this.repository.findUser(req.params.id);

      // Hapus user dari database
      await this.repository.deleteUser(req.params.id);

      // Hapus avatar terkait dari Vercel Blob jika ada
      if (user.avatarUrl && storageService.isBlobUrl(user.avatarUrl)) {
        await storageService.deleteFile(user.avatarUrl);
      }

      ApiResponse.success({ res, message: 'User deleted successfully', data: null });
    } catch (error) {
      next(error);
    }
  };
}
