import { z } from 'zod';

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

const imageUrl = z.string().url().max(2048).nullable().optional();
const booleanInput = z.preprocess((value) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());

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
  isActive: booleanInput.default(true),
});

export const UpdatePackageSchema = CreatePackageSchema.partial();
