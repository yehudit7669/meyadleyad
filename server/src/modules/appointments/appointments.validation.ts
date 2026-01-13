import { z } from 'zod';

export const requestAppointmentSchema = z.object({
  adId: z.string().min(5),
  date: z.string().datetime(),
  note: z.string().max(500).optional(),
});

export const approveRejectSchema = z.object({
  appointmentId: z.string().min(5),
  action: z.enum(['APPROVE', 'REJECT', 'RESCHEDULE']),
  newDate: z.string().optional().transform((val) => {
    if (!val) return undefined;
    // datetime-local returns: "2024-01-15T14:30"
    // Convert to ISO datetime
    return new Date(val).toISOString();
  }),
  reason: z.string().max(250).optional(),
});

export const availabilitySchema = z.object({
  adId: z.string().min(5),
  slots: z
    .array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
      })
    )
    .max(30),
});

export const blockUserSchema = z.object({
  userId: z.string().min(5),
  isBlocked: z.boolean(),
  blockReason: z.string().max(250).optional(),
});
