import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { BadRequestError, ForbiddenError } from '../errors/app.error';
import { AdminRepository } from '../repositories/admin.repository';
import { PasswordUtil } from '../utils/password.util';
import { ApiResponse } from '../utils/response.util';
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserListQuerySchema,
} from '../dtos/admin.dto';

const validationMessage = (error: ZodError): string =>
  JSON.stringify(error.errors.map((item) => ({
    field: item.path.join('.'),
    message: item.message,
  })));

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
      const parsed = UserListQuerySchema.safeParse(req.query);
      if (!parsed.success) throw new BadRequestError(validationMessage(parsed.error));
      const result = await this.repository.listUsers(parsed.data);
      ApiResponse.success({
        res,
        message: 'Users retrieved',
        data: {
          ...result,
          pagination: {
            page: parsed.data.page,
            limit: parsed.data.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / parsed.data.limit),
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
      const parsed = CreateUserSchema.safeParse(req.body);
      if (!parsed.success) throw new BadRequestError(validationMessage(parsed.error));
      const { password, ...user } = parsed.data;
      const created = await this.repository.createUser({
        ...user,
        passwordHash: await PasswordUtil.hash(password),
      });
      ApiResponse.success({
        res,
        statusCode: 201,
        message: 'User created',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = UpdateUserSchema.safeParse(req.body);
      if (!parsed.success) throw new BadRequestError(validationMessage(parsed.error));
      if (req.params.id === req.auth?.userId && parsed.data.role === 'user') {
        throw new ForbiddenError('You cannot remove your own administrator access');
      }
      const { password, ...fields } = parsed.data;
      const updated = await this.repository.updateUser(req.params.id, {
        ...fields,
        ...(password ? { passwordHash: await PasswordUtil.hash(password) } : {}),
      });
      ApiResponse.success({ res, message: 'User updated', data: updated });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.params.id === req.auth?.userId) {
        throw new ForbiddenError('You cannot delete your own account');
      }
      await this.repository.deleteUser(req.params.id);
      ApiResponse.success({ res, message: 'User deleted', data: null });
    } catch (error) {
      next(error);
    }
  };
}
