import { z } from 'zod';

export const addSubscriberSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const dispatchContentSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string().url(),
  recipientEmails: z.array(z.string().email()).optional(), // If not provided, send to all active
});

export type AddSubscriberDto = z.infer<typeof addSubscriberSchema>;
export type DispatchContentDto = z.infer<typeof dispatchContentSchema>;
