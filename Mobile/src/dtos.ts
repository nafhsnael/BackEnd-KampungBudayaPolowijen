import { z } from 'zod';

const email = z.string().trim().email('Email tidak valid').max(255).transform((value) => value.toLowerCase());
const password = z.string().min(6, 'Password minimal 6 karakter').max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(150),
  email,
  password,
  passwordConfirmation: z.string(),
}).superRefine((data, context) => {
  if (data.password !== data.passwordConfirmation) {
    context.addIssue({
      code: 'custom',
      path: ['passwordConfirmation'],
      message: 'Konfirmasi password tidak sama',
    });
  }
});

export const loginSchema = z.object({ email, password });

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(150).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama wajib diisi'),
  password,
  passwordConfirmation: z.string(),
}).superRefine((data, context) => {
  if (data.password !== data.passwordConfirmation) {
    context.addIssue({
      code: 'custom',
      path: ['passwordConfirmation'],
      message: 'Konfirmasi password tidak sama',
    });
  }
});

export const umkmQuerySchema = z.object({
  category: z.string().trim().max(100).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(50).default(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
