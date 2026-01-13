import { z } from 'zod';

export const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'כותרת חובה'),
    description: z.string().optional(),
    imageUrl: z.string().url('כתובת תמונה לא תקינה'),
    link: z.string().url('קישור לא תקין').optional().or(z.literal('')),
    position: z.enum(['top', 'middle', 'bottom', 'sidebar'], {
      errorMap: () => ({ message: 'מיקום לא תקין' }),
    }),
    order: z.number().int().min(0).default(0),
    startDate: z.string().datetime('תאריך התחלה לא תקין'),
    endDate: z.string().datetime('תאריך סיום לא תקין'),
    isActive: z.boolean().default(true),
  }),
});

export const updateBannerSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    link: z.string().url().optional().or(z.literal('')),
    position: z.enum(['top', 'middle', 'bottom', 'sidebar']).optional(),
    order: z.number().int().min(0).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getBannersSchema = z.object({
  query: z.object({
    position: z.enum(['top', 'middle', 'bottom', 'sidebar']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
  }),
});
