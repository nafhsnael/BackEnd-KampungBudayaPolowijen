import { z } from 'zod';

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

export const EventListQuerySchema = z.object({
  status: z.string().trim().max(50).optional(),
  search: z.string().trim().max(100).optional(),
});

export const CreateEventSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: optionalText(5000),
  eventDate: z.string().trim().min(1).max(64),
  capacity: optionalText(100),
  price: optionalText(100),
  status: z.string().trim().max(50).optional(),
  posterUrl: z.string().url().max(2048).nullable().optional(),
});

export const UpdateEventSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  description: optionalText(5000),
  eventDate: z.string().trim().min(1).max(64).optional(),
  capacity: optionalText(100),
  price: optionalText(100),
  status: z.string().trim().max(50).optional(),
  posterUrl: z.string().url().max(2048).nullable().optional(),
});
