import { z } from 'zod';

const userFields = {
  email: z.string().email().toLowerCase().trim(),
  fullName: z.string().max(150).trim().optional(),
  username: z.string().min(2).max(100).trim().optional(),
  roleTitle: z.string().max(100).trim().optional(),
  role: z.enum(['user', 'admin']).optional(),
  access: z.enum(['user', 'admin']).optional(),
  status: z.enum(['Aktif', 'Suspended']).optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
};

export const CreateUserSchema = z.object({
  ...userFields,
  password: z.string().min(6).max(128),
});

export const UpdateUserSchema = z
  .object({
    email: userFields.email.optional(),
    fullName: userFields.fullName,
    username: userFields.username,
    roleTitle: userFields.roleTitle,
    role: userFields.role,
    access: userFields.access,
    status: userFields.status,
    avatarUrl: userFields.avatarUrl,
    password: z.string().min(6).max(128).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

export const UserListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.string().trim().optional(),
  access: z.enum(['user', 'admin']).optional(),
  status: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
export type UserListQueryDTO = z.infer<typeof UserListQuerySchema>;
