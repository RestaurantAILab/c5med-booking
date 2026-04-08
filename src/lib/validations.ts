import { z } from "zod";

export const bookingSchema = z.object({
  storeId: z.string().min(1),
  courseId: z.number().int().positive(),
  email: z.string().email("有効なメールアドレスを入力してください"),
  name: z.string().min(1, "お名前を入力してください"),
  phone: z.string().optional(),
  note: z.string().optional(),
  bookedAt: z.string().datetime({ offset: true }),
});

export const availabilityQuerySchema = z.object({
  storeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  courseId: z.coerce.number().int().positive(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
