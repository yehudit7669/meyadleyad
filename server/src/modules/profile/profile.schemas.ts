import { z } from 'zod';

// Preference schemas
export const updatePreferencesSchema = z.object({
  weeklyDigest: z.boolean().optional(),
  notifyNewMatches: z.boolean().optional(),
  filters: z.object({
    categoryIds: z.array(z.string()).optional(),  // Category IDs
    cityIds: z.array(z.string()).optional(),       // City IDs
    minPrice: z.number().nullable().optional(),    // Minimum price
    maxPrice: z.number().nullable().optional(),    // Maximum price
    propertyTypes: z.array(z.string()).optional(), // e.g., ['דירה', 'בית פרטי']
    publisherTypes: z.array(z.enum(['OWNER', 'BROKER'])).optional(), // Publisher types
  }).partial().optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

// Personal details schema
export const updatePersonalDetailsSchema = z.object({
  name: z.string().min(2, 'שם חייב להיות לפחות 2 תווים').max(100).optional(),
  phone: z.string()
    .optional()
    .transform(v => v?.trim() || undefined)
    .refine(v => !v || /^05\d{8}$/.test(v), { message: 'מספר טלפון לא תקין (05XXXXXXXX)' }),
});

export type UpdatePersonalDetailsInput = z.infer<typeof updatePersonalDetailsSchema>;

// Appointment schemas
export const createAppointmentSchema = z.object({
  adId: z.string(),
  startsAt: z.string().datetime().or(z.date()),
  notes: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELED']),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

// Query schemas
export const myAdsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
});

export const favoritesQuerySchema = z.object({
  limit: z.string().optional().default('100'),
});

export type MyAdsQuery = z.infer<typeof myAdsQuerySchema>;
export type FavoritesQuery = z.infer<typeof favoritesQuerySchema>;
