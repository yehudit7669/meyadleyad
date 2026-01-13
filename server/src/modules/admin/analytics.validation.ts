import { z } from 'zod';

export const trackPageViewSchema = z.object({
  path: z.string(),
  durationSeconds: z.number().int().min(0).optional(),
  sessionId: z.string().optional(),
});

export const getAnalyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export type TrackPageViewDto = z.infer<typeof trackPageViewSchema>;
export type GetAnalyticsQueryDto = z.infer<typeof getAnalyticsQuerySchema>;
