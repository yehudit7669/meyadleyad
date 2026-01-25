import { z } from 'zod';

export const createContentItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['PDF', 'LINK']),
  url: z.string().url('Invalid URL'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
});

export const updateContentItemSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'NOT_DISTRIBUTED', 'ARCHIVED']).optional(),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
});

export const distributeContentSchema = z.object({
  contentItemId: z.string(),
  mode: z.enum(['INITIAL', 'REDISTRIBUTE', 'PUSH']),
  recipientEmails: z.array(z.string().email()).optional(),
});

export const addSubscriberSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
});

export const updateSubscriberSchema = z.object({
  status: z.enum(['ACTIVE', 'OPT_OUT', 'BLOCKED']).optional(),
  name: z.string().optional(),
  emailUpdatesEnabled: z.boolean().optional(),
  emailUpdatesCategories: z.array(z.string()).optional(),
});

export type CreateContentItemDto = z.infer<typeof createContentItemSchema>;
export type UpdateContentItemDto = z.infer<typeof updateContentItemSchema>;
export type DistributeContentDto = z.infer<typeof distributeContentSchema>;
export type AddSubscriberDto = z.infer<typeof addSubscriberSchema>;
export type UpdateSubscriberDto = z.infer<typeof updateSubscriberSchema>;
