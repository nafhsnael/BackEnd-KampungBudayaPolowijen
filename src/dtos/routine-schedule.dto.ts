import { z } from 'zod';

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

const imageUrl = z.string().url().max(2048).nullable().optional();
const scheduleTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional();

export const CreateRoutineScheduleSchema = z.object({
  name: z.string().trim().min(1).max(150),
  day: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']),
  startTime: scheduleTime,
  endTime: scheduleTime,
  description: optionalText(5000),
  capacity: optionalText(100),
  price: optionalText(100),
  imageUrl,
});

export const UpdateRoutineScheduleSchema = CreateRoutineScheduleSchema.partial();
