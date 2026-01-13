import { z } from 'zod';

// Personal details update
export const updatePersonalDetailsSchema = z.object({
  fullName: z.string().min(2, 'שם מלא חייב להכיל לפחות 2 תווים').optional(),
  phonePersonal: z.string().regex(/^05\d{8}$/, 'טלפון אישי לא תקין (נדרש 05XXXXXXXX)'),
  businessPhone: z.string().regex(/^0\d{8,9}$/, 'טלפון משרד לא תקין').optional().or(z.literal('')),
  officeAddress: z.string().optional().or(z.literal('')),
});

// Office details update
export const updateOfficeDetailsSchema = z.object({
  businessName: z.string().min(2, 'שם עסק חייב להכיל לפחות 2 תווים').optional(),
  businessAddressPending: z.string().optional().or(z.literal('')),
  publishOfficeAddress: z.boolean().optional(),
  aboutBusinessPending: z.string().max(1000, 'תיאור העסק לא יכול להכיל יותר מ-1000 תווים').optional().or(z.literal('')),
});

// Team member creation/update
export const createTeamMemberSchema = z.object({
  fullName: z.string().min(2, 'שם מלא חייב להכיל לפחות 2 תווים'),
  email: z.string().email('כתובת מייל לא תקינה'),
  phone: z.string().regex(/^05\d{8}$/, 'מספר טלפון לא תקין'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
});

export const updateTeamMemberSchema = z.object({
  fullName: z.string().min(2, 'שם מלא חייב להכיל לפחות 2 תווים').optional(),
  email: z.string().email('כתובת מייל לא תקינה').optional(),
  phone: z.string().regex(/^05\d{8}$/, 'מספר טלפון לא תקין').optional(),
  isActive: z.boolean().optional(),
});

// Communication preferences
export const updateCommunicationSchema = z.object({
  weeklyDigestOptIn: z.boolean(),
});

// Email change request
export const requestEmailChangeSchema = z.object({
  newEmail: z.string().email('כתובת מייל לא תקינה'),
});

// Featured request
export const createFeaturedRequestSchema = z.object({
  adId: z.string().min(1, 'חובה לבחור מודעה'),
  notes: z.string().max(500, 'הערות לא יכולות להכיל יותר מ-500 תווים').optional(),
});

// Appointment response
export const respondToAppointmentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'RESCHEDULE_REQUESTED']),
  note: z.string().max(500).optional(),
  newDate: z.string().datetime().optional(),
});

// Availability slot
export const createAvailabilitySlotSchema = z.object({
  adId: z.string().min(1, 'חובה לבחור מודעה'),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'זמן התחלה לא תקין (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'זמן סיום לא תקין (HH:MM)'),
});

// Account deletion request
export const createAccountDeletionRequestSchema = z.object({
  reason: z.string().max(500, 'סיבה לא יכולה להכיל יותר מ-500 תווים').optional(),
});

export type UpdatePersonalDetailsInput = z.infer<typeof updatePersonalDetailsSchema>;
export type UpdateOfficeDetailsInput = z.infer<typeof updateOfficeDetailsSchema>;
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type UpdateCommunicationInput = z.infer<typeof updateCommunicationSchema>;
export type RequestEmailChangeInput = z.infer<typeof requestEmailChangeSchema>;
export type CreateFeaturedRequestInput = z.infer<typeof createFeaturedRequestSchema>;
export type RespondToAppointmentInput = z.infer<typeof respondToAppointmentSchema>;
export type CreateAvailabilitySlotInput = z.infer<typeof createAvailabilitySlotSchema>;
export type CreateAccountDeletionRequestInput = z.infer<typeof createAccountDeletionRequestSchema>;
