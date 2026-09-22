import { z } from 'zod';

/**
 * DTO & Validation Schema for Standard Email & Password Login
 */
export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address format')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

/**
 * DTO & Validation Schema for Google OAuth Login
 */
export const GoogleLoginSchema = z.object({
  idToken: z
    .string({ required_error: 'Google ID Token is required' })
    .min(1, 'Google ID Token cannot be empty'),
});

export type GoogleLoginDTO = z.infer<typeof GoogleLoginSchema>;
