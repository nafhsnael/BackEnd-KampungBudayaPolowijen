import { z } from 'zod';

const imageUrl = z.string().url().max(2048).nullable().optional();

export const UmkmListQuerySchema = z.object({
  category: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
});

export const CreateUmkmSchema = z.object({
  name: z.string().trim().min(1).max(150),
  category: z.string().trim().min(1).max(100),
  description: z.string().trim().max(5000).optional(),
  price: z.coerce.number().finite().min(0).optional().default(0),
  imageUrl,
});

export const UpdateUmkmSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  price: z.coerce.number().finite().min(0).optional(),
  imageUrl,
});
