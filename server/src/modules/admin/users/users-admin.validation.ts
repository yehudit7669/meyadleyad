import { z } from 'zod';
import { UserRole, UserStatus } from '@prisma/client';

// Query params for users list
export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  q: z.string().optional(),
  searchBy: z.enum(['name', 'email', 'id']).optional(),
  roleType: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['createdAt', 'name', 'email', 'adsCount']).optional().default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;

// Update user schema
export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  roleType: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  weeklyDigestOptIn: z.boolean().optional(),
  notifyNewMatches: z.boolean().optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

// Meetings block schema
export const meetingsBlockSchema = z.object({
  blocked: z.boolean(),
  reason: z.string().max(500).optional(),
});

export type MeetingsBlockDto = z.infer<typeof meetingsBlockSchema>;

// Bulk remove ads schema
export const bulkRemoveAdsSchema = z.object({
  reason: z.string().min(1).max(500),
});

export type BulkRemoveAdsDto = z.infer<typeof bulkRemoveAdsSchema>;

// Export users schema
export const exportUsersSchema = z.object({
  format: z.enum(['csv', 'xlsx']).optional().default('csv'),
  filters: z.object({
    roleType: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }).optional(),
});

export type ExportUsersDto = z.infer<typeof exportUsersSchema>;
