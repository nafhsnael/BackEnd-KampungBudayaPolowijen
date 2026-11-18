import { z } from 'zod';

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

const imageUrl = z.string().url().max(500).nullable().optional();

export const PackageListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
});

export const CreatePackageSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: optionalText(5000),
  duration: optionalText(100),
  capacity: optionalText(100),
  price: z.coerce.number().finite().min(0).default(0),
  imageUrl,
  isActive: z.boolean().default(true),
});

export const UpdatePackageSchema = CreatePackageSchema.partial();
