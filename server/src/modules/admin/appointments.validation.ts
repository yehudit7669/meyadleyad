import { z } from 'zod';

export const getAppointmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'RESCHEDULE_REQUESTED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().optional(),
  adId: z.string().optional(),
});

export type GetAppointmentsQueryDto = z.infer<typeof getAppointmentsQuerySchema>;
