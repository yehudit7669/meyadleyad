import { z } from 'zod';

export const updateMeetingAccessSchema = z.object({
  isBlocked: z.boolean(),
  reason: z.string().max(250).optional().nullable(),
});

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['USER', 'BROKER', 'ADMIN']).optional(),
  search: z.string().optional(),
});

export type UpdateMeetingAccessDto = z.infer<typeof updateMeetingAccessSchema>;
export type GetUsersQueryDto = z.infer<typeof getUsersQuerySchema>;
