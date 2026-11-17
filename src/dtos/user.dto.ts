import { z } from 'zod';

export const UpdateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1).max(150).optional(),
    username: z.string().trim().min(2).max(100).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });
