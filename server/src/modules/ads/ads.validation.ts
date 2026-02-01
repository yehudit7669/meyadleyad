import { z } from 'zod';

// Helper function to validate description content
const validateDescriptionContent = (description: string): boolean => {
  // Block URLs (http, https, www)
  const urlPattern = /(https?:\/\/|www\.)/i;
  if (urlPattern.test(description)) {
    return false;
  }
  
  // Block phone numbers (9-10 consecutive digits or patterns like 05X-XXXXXXX)
  const phonePattern = /(\d[\s.-]?){9,10}|05\d[-\s]?\d{7}/;
  if (phonePattern.test(description)) {
    return false;
  }
  
  // Block promotional text (basic keywords)
  const promoWords = /מבצע|הזדמנות|הצעה מיוחדת|במחיר מיוחד|לזמן מוגבל/i;
  if (promoWords.test(description)) {
    return false;
  }
  
  return true;
};

// Custom description validator for residential ads (for sale/rent)
const residentialDescriptionSchema = z.string()
  .refine((val) => {
    const wordCount = val.trim().split(/\s+/).filter(word => word.length > 0).length;
    return wordCount <= 16;
  }, {
    message: 'התיאור חייב להכיל עד 16 מילים',
  })
  .refine(validateDescriptionContent, {
    message: 'התיאור מכיל תוכן אסור (קישורים, מספרי טלפון, או טקסט פרסומי)',
  });

// Schema for regular property ads (existing properties)
export const createAdSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'כותרת חייבת להכיל לפחות 5 תווים').max(200, 'כותרת חייבת להיות עד 200 תווים'),
    description: z.string().optional().or(z.literal('')),
    price: z.number().positive('מחיר חייב להיות חיובי').optional(),
    categoryId: z.string().min(1, 'קטגוריה לא תקינה'),
    adType: z.string().optional(), // Optional for regular ads for backwards compatibility
    cityId: z.string().min(1, 'עיר לא תקינה'),
    streetId: z.string().min(1, 'רחוב לא תקין'),
    houseNumber: z.number().int('מספר בית חייב להיות מספר שלם').positive('מספר בית חייב להיות חיובי'),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    customFields: z.record(z.any()).optional(),
    contactName: z.string().optional(),
    contactPhone: z.string().min(9, 'טלפון חייב להכיל לפחות 9 ספרות').max(15, 'טלפון ארוך מדי'),
    sendCopyToEmail: z.boolean().optional().default(true),
  }),
}).superRefine((data, ctx) => {
  // Apply strict description validation for FOR_SALE and FOR_RENT ads only if description is provided
  if ((data.body.adType === 'FOR_SALE' || data.body.adType === 'FOR_RENT') && data.body.description) {
    const result = residentialDescriptionSchema.safeParse(data.body.description);
    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error.errors[0].message,
        path: ['body', 'description'],
      });
    }
  }
});

// Schema for wanted ads (looking for property)
export const createWantedAdSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'כותרת חייבת להכיל לפחות 5 תווים').max(200, 'כותרת חייבת להיות עד 200 תווים'),
    description: z.string().optional().or(z.literal('')),
    price: z.number().nonnegative('מחיר חייב להיות חיובי או 0').optional(),
    categoryId: z.string().min(1, 'קטגוריה לא תקינה'),
    adType: z.enum(['WANTED_FOR_SALE', 'WANTED_FOR_RENT', 'WANTED_HOLIDAY', 'WANTED_COMMERCIAL']),
    
    // Free text for requested location (not a real address)
    requestedLocationText: z.string().min(2, 'יש להזין אזור או רחוב מבוקש'),
    
    customFields: z.record(z.any()).optional(),
    contactName: z.string().optional(),
    contactPhone: z.string().min(9, 'טלפון חייב להכיל לפחות 9 ספרות').max(15, 'טלפון ארוך מדי'),
    sendCopyToEmail: z.boolean().optional().default(true),
    
    // These should NOT be required for wanted ads
    cityId: z.string().optional(),
    streetId: z.string().optional(),
    houseNumber: z.number().optional(),
    address: z.string().optional(),
  }),
});

export const updateAdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    title: z.string().min(5).max(200).optional(),
    description: z.string().optional().or(z.literal('')),
    price: z.number().positive().optional(),
    categoryId: z.string().min(1).optional(),
    adType: z.string().optional(),
    cityId: z.string().min(1).optional(),
    streetId: z.string().min(1).optional(),
    houseNumber: z.number().int().positive().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    customFields: z.record(z.any()).optional(),
    contactName: z.string().optional(),
    contactPhone: z.string().min(9).max(15).optional(),
  }),
}).superRefine((data, ctx) => {
  // Apply strict description validation for FOR_SALE and FOR_RENT ads only if description is provided
  if ((data.body.adType === 'FOR_SALE' || data.body.adType === 'FOR_RENT') && data.body.description) {
    const result = residentialDescriptionSchema.safeParse(data.body.description);
    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error.errors[0].message,
        path: ['body', 'description'],
      });
    }
  }
});

export const getAdsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    categoryId: z.string().optional(),
    cityId: z.string().optional(),
    cities: z.string().optional(), // Support multiple cities as comma-separated string
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    search: z.string().optional(),
    userId: z.string().optional(),
    status: z.enum(['DRAFT', 'PENDING', 'ACTIVE', 'APPROVED', 'REJECTED', 'EXPIRED', 'REMOVED']).optional(),
  }),
});

export const approveAdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    approved: z.boolean(),
    rejectionReason: z.string().optional(),
  }),
});
