import { z } from 'zod';
import { ConversationStatus } from '@prisma/client';

export const createContactSchema = z.object({
  message: z.string()
    .min(10, 'ההודעה חייבת להכיל לפחות 10 תווים')
    .max(2000, 'ההודעה לא יכולה להכיל יותר מ-2000 תווים')
    .trim(),
  guestEmail: z.string()
    .email('כתובת אימייל לא תקינה')
    .trim()
    .toLowerCase()
    .optional(),
});

export const sendMessageSchema = z.object({
  body: z.string()
    .min(1, 'תוכן ההודעה חובה')
    .max(2000, 'ההודעה לא יכולה להכיל יותר מ-2000 תווים')
    .trim(),
});

export const conversationFiltersSchema = z.object({
  status: z.nativeEnum(ConversationStatus).optional(),
  search: z.string()
    .max(200)
    .trim()
    .optional(),
  unread: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
