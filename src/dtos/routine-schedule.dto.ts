import { z } from 'zod';

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

const imageUrl = z.string().url().max(2048).nullable().optional();

export const CreateRoutineScheduleSchema = z.object({
  name: z.string().trim().min(1).max(150),
  day: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']),
  description: optionalText(5000),
  capacity: optionalText(100),
  price: optionalText(100),
  imageUrl,
});

export const UpdateRoutineScheduleSchema = CreateRoutineScheduleSchema.partial();
