import { z } from 'zod';

export const getAppointmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELED', 'COMPLETED', 'RESCHEDULE_REQUESTED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().optional(),
  adId: z.string().optional(),
  q: z.string().optional(),
  searchBy: z.enum(['userName', 'phone', 'propertyAddress']).optional(),
  sortBy: z.enum(['createdAt', 'date', 'status']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELED', 'COMPLETED']),
  reason: z.string().max(250).optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().min(1).max(250),
});

export type GetAppointmentsQueryDto = z.infer<typeof getAppointmentsQuerySchema>;
export type UpdateAppointmentStatusDto = z.infer<typeof updateAppointmentStatusSchema>;
export type CancelAppointmentDto = z.infer<typeof cancelAppointmentSchema>;
