import { z } from 'zod';

const userFields = {
  email: z.string().email().toLowerCase().trim(),
  fullName: z.string().min(1).max(150).trim(),
  role: z.enum(['user', 'admin']),
  avatarUrl: z.string().url().max(500).nullable().optional(),
};

export const CreateUserSchema = z.object({
  ...userFields,
  password: z.string().min(6).max(128),
});

export const UpdateUserSchema = z
  .object({
    email: userFields.email.optional(),
    fullName: userFields.fullName.optional(),
    role: userFields.role.optional(),
    avatarUrl: userFields.avatarUrl,
    password: z.string().min(6).max(128).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

export const UserListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(['user', 'admin']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
