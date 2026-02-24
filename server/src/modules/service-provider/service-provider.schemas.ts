import { z } from 'zod';

// Service Provider Profile Update Schema
export const updateServiceProviderProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phonePersonal: z.string().optional().nullable(),
  phoneBusinessOffice: z.string().optional().nullable(),
  aboutBusinessPending: z.string().max(2000).optional().nullable(),
  logoUrlPending: z.string().url().optional().nullable(),
  publishOfficeAddress: z.boolean().optional(),
  businessHours: z.record(
    z.enum(['sun', 'mon', 'tue', 'wed', 'thu', 'fri']),
    z.array(z.object({
      from: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      to: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    }))
  ).optional(),
  weeklyDigestSubscribed: z.boolean().optional(),
});

export type UpdateServiceProviderProfileInput = z.infer<typeof updateServiceProviderProfileSchema>;

// Office Address Change Request
export const createOfficeAddressChangeSchema = z.object({
  newAddress: z.string().min(5).max(200),
});

export type CreateOfficeAddressChangeInput = z.infer<typeof createOfficeAddressChangeSchema>;

// Data Export Request
export const createDataExportRequestSchema = z.object({
  // No fields needed, just the request
});

export type CreateDataExportRequestInput = z.infer<typeof createDataExportRequestSchema>;

// Account Deletion Request
export const createAccountDeletionRequestSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateAccountDeletionRequestInput = z.infer<typeof createAccountDeletionRequestSchema>;

// Highlight Request
export const createHighlightRequestSchema = z.object({
  requestType: z.enum(['SERVICE_CARD', 'BUSINESS_PAGE']),
  reason: z.string().max(500).optional(),
});

export type CreateHighlightRequestInput = z.infer<typeof createHighlightRequestSchema>;

// Service Provider Contact Request
export const serviceProviderContactRequestSchema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  phone: z.string().refine((val) => {
    const digits = val.replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 10;
  }, 'מספר טלפון לא תקין (נדרשים 9-10 ספרות)'),
  email: z.string().email('כתובת מייל לא תקינה'),
});

export type ServiceProviderContactRequestInput = z.infer<typeof serviceProviderContactRequestSchema>;
