import { z } from 'zod';

export const getStreetsSchema = z.object({
  query: z.object({
    query: z.string().optional(),
    cityId: z.string().optional(), // Can be UUID or slug like "beit-shemesh"
    limit: z.string().optional(),
  }),
});

export const getStreetByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'מזהה רחוב לא תקין'),
  }),
});
