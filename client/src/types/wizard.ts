import { z } from 'zod';

// ======================
// Ad Type Enums
// ======================

export enum AdType {
  FOR_SALE = 'FOR_SALE',
  FOR_RENT = 'FOR_RENT',
  UNIT = 'UNIT',
  HOLIDAY_RENT = 'HOLIDAY_RENT',
  SHARED_TABU = 'SHARED_TABU',
  PROJECT = 'PROJECT',
  COMMERCIAL = 'COMMERCIAL',
  SERVICE_PROVIDERS = 'SERVICE_PROVIDERS',
  JOB = 'JOB',
  WANTED_FOR_SALE = 'WANTED_FOR_SALE',
  WANTED_FOR_RENT = 'WANTED_FOR_RENT',
  WANTED_HOLIDAY = 'WANTED_HOLIDAY',
  WANTED_COMMERCIAL = 'WANTED_COMMERCIAL',
  WANTED_SHARED_OWNERSHIP = 'WANTED_SHARED_OWNERSHIP',
  WANTED = 'WANTED',
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  DUPLEX = 'DUPLEX',
  GARDEN_APARTMENT = 'GARDEN_APARTMENT',
  PRIVATE_HOUSE = 'PRIVATE_HOUSE',
  PENTHOUSE = 'PENTHOUSE',
  TWO_STORY = 'TWO_STORY',
  SEMI_DETACHED = 'SEMI_DETACHED',
  UNIT = 'UNIT',
  STUDIO = 'STUDIO',
  COTTAGE = 'COTTAGE',
  VILLA = 'VILLA',
}

export enum PropertyCondition {
  NEW_FROM_CONTRACTOR = 'NEW_FROM_CONTRACTOR',
  NEW = 'NEW',
  RENOVATED = 'RENOVATED',
  MAINTAINED = 'MAINTAINED',
  OLD = 'OLD',
}

export enum FurnitureStatus {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  NONE = 'NONE',
}

export enum CommercialPropertyType {
  STORE = 'STORE',
  OFFICE = 'OFFICE',
  WAREHOUSE = 'WAREHOUSE',
  HALL = 'HALL',
}

export enum ProjectStatus {
  PRE_MARKETING = 'PRE_MARKETING',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
  PARTIALLY_OCCUPIED = 'PARTIALLY_OCCUPIED',
}

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  FREELANCE = 'FREELANCE',
}

// ======================
// Wizard Step Types
// ======================

export interface WizardStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrev: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

// ======================
// Residential (Sale/Rent/Unit) Types
// ======================

export interface ResidentialStep1Data {
  hasBroker: boolean;
}

export interface ResidentialStep2Data {
  cityId: string;
  cityName: string;
  streetId?: string;
  streetName?: string;
  neighborhoodId?: string;
  neighborhoodName: string;
  houseNumber?: number;
  addressSupplement?: string;
}

export interface ResidentialStep3Data {
  propertyType: PropertyType;
  rooms: number;
  squareMeters?: number;
  condition?: PropertyCondition;
  floor?: string | number;
  balconies?: number;
  furniture?: FurnitureStatus;
  entryDate?: string;
  price?: number;
  arnona?: number;
  vaad?: number;
  features: {
    parking: boolean;
    storage: boolean;
    safeRoom: boolean;
    sukkaBalcony: boolean;
    elevator: boolean;
    view: boolean;
    parentalUnit: boolean;
    housingUnit: boolean;
    yard: boolean;
    garden: boolean;
    frontFacing: boolean;
    upgradedKitchen: boolean;
    accessibleForDisabled: boolean;
    airConditioning: boolean;
    hasOption: boolean;
  };
}

export interface ResidentialStep4Data {
  description: string;
  images: Array<{
    url: string;
    file?: File;
    isPrimary: boolean;
    order: number;
  }>;
  floorPlan?: File | null;
}

export interface ResidentialStep5Data {
  contactName?: string;
  contactPhone: string;
  agreeToTerms: boolean;
  weeklyDigestOptIn?: boolean;
}

export interface ResidentialWizardData {
  adType: AdType.FOR_SALE | AdType.FOR_RENT | AdType.UNIT;
  step1: ResidentialStep1Data;
  step2: ResidentialStep2Data;
  step3: ResidentialStep3Data;
  step4: ResidentialStep4Data;
  step5: ResidentialStep5Data;
}

// ======================
// Shared Ownership (טאבו משותף) Types
// ======================

export interface SharedOwnershipStep1Data {
  hasBroker: boolean;
}

export interface SharedOwnershipStep2Data {
  cityId: string;
  cityName: string;
  streetId?: string;
  streetName?: string;
  neighborhoodId?: string;
  neighborhoodName: string;
  houseNumber?: number;
  addressSupplement?: string;
}

export interface SharedOwnershipStep3Data {
  propertyType: PropertyType;
  rooms: number;
  squareMeters?: number;
  condition?: PropertyCondition;
  floor?: string | number;
  balconies?: number;
  priceRequested?: number;
  arnona?: number;
  vaad?: number;
  requiredEquity?: number;
  numberOfPartners?: number;
  entryDate?: string;
  features: {
    parking: boolean;
    storage: boolean;
    view: boolean;
    airConditioning: boolean;
    sukkaBalcony: boolean;
    safeRoom: boolean;
    parentalUnit: boolean;
    elevator: boolean;
    yard: boolean;
    garden: boolean;
    frontFacing: boolean;
    upgradedKitchen: boolean;
    accessibleForDisabled: boolean;
  };
}

export interface SharedOwnershipStep4Data {
  description: string;
  images: Array<{
    url: string;
    file?: File;
    isPrimary: boolean;
    order: number;
  }>;
  floorPlan?: File | null;
}

export interface SharedOwnershipStep5Data {
  contactName?: string;
  contactPhone: string;
  agreeToTerms: boolean;
  weeklyDigestOptIn?: boolean;
}

export interface SharedOwnershipWizardData {
  adType: AdType.SHARED_TABU;
  step1: SharedOwnershipStep1Data;
  step2: SharedOwnershipStep2Data;
  step3: SharedOwnershipStep3Data;
  step4: SharedOwnershipStep4Data;
  step5: SharedOwnershipStep5Data;
}

export interface WantedSharedOwnershipWizardData {
  adType: AdType.WANTED_SHARED_OWNERSHIP;
  step1: SharedOwnershipStep1Data;
  step2: SharedOwnershipStep2Data;
  step3: SharedOwnershipStep3Data;
  step4: SharedOwnershipStep5Data; // Contact info (no images step)
}

// ======================
// Holiday (Shabbat) Types - Updated
// ======================

export interface HolidayRentStep1Data {
  cityId: string;
  cityName: string;
  streetId?: string;
  streetName?: string;
  neighborhoodId?: string;
  neighborhoodName: string;
  houseNumber?: number;
}

export interface HolidayRentStep2Data {
  isPaid: boolean;
}

export interface HolidayRentStep3Data {
  parasha: string;
  propertyType: PropertyType;
  rooms: number;
  purpose: 'HOSTING' | 'SLEEPING_ONLY';
  floor?: number | string;
  balconiesCount: number;
  beds?: number;
  priceRequested?: number;
  features: {
    plata: boolean;
    urn: boolean;
    view: boolean;
    linens: boolean;
    ac: boolean;
    balcony: boolean;
    pool: boolean;
    yard: boolean;
    kidsGames: boolean;
    babyBed: boolean;
    masterUnit: boolean;
    sleepingOnly: boolean;
    accessibleForDisabled: boolean;
  };
}

export interface HolidayRentStep4Data {
  contactName?: string;
  contactPhone: string;
  sendCopyToEmail?: boolean;
}

export interface HolidayRentWizardData {
  adType: AdType.HOLIDAY_RENT;
  step1: HolidayRentStep1Data;
  step2: HolidayRentStep2Data;
  step3: HolidayRentStep3Data;
  step4: HolidayRentStep4Data;
}

// Old Holiday types (kept for reference)
export interface HolidayStep1Data {
  isOffering: boolean; // true = מציע, false = מחפש
  occasionType: 'SHABBAT' | 'HOLIDAY' | 'PACKAGE';
}

export interface HolidayStep2OfferData {
  cityId: string;
  cityName: string;
  streetId: string;
  streetName: string;
  neighborhoodId: string;
  neighborhoodName: string;
  houseNumber: string;
  addressSupplement?: string;
}

export interface HolidayStep2WantedData {
  preferredNeighborhoods: string[]; // neighborhood IDs
  anyNeighborhood: boolean;
}

export interface HolidayStep3OfferData {
  accommodationType: 'OVERNIGHT_ONLY' | 'OVERNIGHT_WITH_HOSTING';
  beds: number;
  bedrooms: number;
  features: {
    hotPlate: boolean;
    urn: boolean;
    bedding: boolean;
    babyBed: boolean;
    toys: boolean;
    pool: boolean;
    balcony: boolean;
    yard: boolean;
  };
  priceShabbat?: number;
  priceHoliday?: number;
  availableDates: string;
  description: string;
}

export interface HolidayStep3WantedData {
  numberOfPeople: number;
  preferredDates: string;
  maxPrice?: number;
  description: string;
}

export interface HolidayWizardData {
  adType: AdType.HOLIDAY_RENT;
  step1: HolidayStep1Data;
  step2: HolidayStep2OfferData | HolidayStep2WantedData;
  step3: HolidayStep3OfferData | HolidayStep3WantedData;
  step4?: { images: { url: string }[] }; // Only for offering
  step5: {
    contactName: string;
    contactPhone: string;
    agreeToTerms: boolean;
  };
}

// ======================
// Project Types
// ======================

export interface ProjectWizardData {
  adType: AdType.PROJECT;
  projectName: string;
  projectType: 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED';
  cityId: string;
  location: string;
  status: ProjectStatus;
  priceFrom?: number;
  priceTo?: number;
  constructionCompany: string;
  description: string;
  images: { url: string }[];
  contactName: string;
  contactPhone: string;
  agreeToTerms: boolean;
}

// ======================
// Commercial Types
// ======================

export interface CommercialWizardData {
  adType: AdType.COMMERCIAL;
  propertyType: CommercialPropertyType;
  cityId: string;
  streetId: string;
  houseNumber: string;
  squareMeters: number;
  floor: number;
  streetFront: boolean;
  divisible: boolean;
  price: number;
  isForRent: boolean; // true = השכרה, false = מכירה
  features: {
    parking: boolean;
    elevator: boolean;
    businessLicense: boolean;
  };
  description: string;
  images: { url: string }[];
  contactName: string;
  contactPhone: string;
  agreeToTerms: boolean;
}

// ======================
// Job Types
// ======================

export interface JobWizardData {
  adType: AdType.JOB;
  jobTitle: string;
  jobType: JobType;
  field: string;
  description: string;
  requirements: string;
  cityId: string;
  neighborhood?: string;
  salaryRange?: string;
  contactPhone: string;
  contactEmail?: string;
  externalLink?: string;
  agreeToTerms: boolean;
}

// ======================
// Zod Validation Schemas
// ======================

// Israeli phone number validation
// Supports: 05X (mobile), 07X (mobile - Golan/Hot Mobile), 02-04 (landline), 08-09 (landline)
const phoneRegex = /^0(5[0-9]|7[0-9]|[2-4]|[8-9])[0-9]{7,8}$/;

// Residential Schemas
export const residentialStep1Schema = z.object({
  hasBroker: z.boolean(),
});

export const residentialStep2Schema = z.object({
  cityId: z.string().min(1, 'יש לבחור עיר'),
  cityName: z.string(),
  streetId: z.string().optional(),
  streetName: z.string().optional(),
  neighborhoodId: z.string().optional(),
  neighborhoodName: z.string().min(1, 'יש לבחור שכונה'),
  houseNumber: z.number().int('מספר בית חייב להיות מספר שלם').positive('מספר בית חייב להיות חיובי').optional(),
  addressSupplement: z.string().optional(),
}).refine((data) => data.streetId || data.neighborhoodName, {
  message: 'יש להזין רחוב או שכונה',
  path: ['neighborhoodName'],
});

export const residentialStep3Schema = z.object({
  propertyType: z.nativeEnum(PropertyType),
  rooms: z.number().min(1, 'יש לבחור מספר חדרים'),
  squareMeters: z.number().min(1, 'יש להזין שטח').optional(),
  condition: z.nativeEnum(PropertyCondition).optional(),
  floor: z.union([z.number(), z.string()]).optional(),
  balconies: z.number().min(0).max(3).optional(),
  furniture: z.nativeEnum(FurnitureStatus).optional(),
  entryDate: z.string().optional(),
  price: z.number().positive('המחיר חייב להיות חיובי').optional(),
  arnona: z.number().min(0).optional(),
  vaad: z.number().min(0).optional(),
  features: z.object({
    parking: z.boolean(),
    storage: z.boolean(),
    safeRoom: z.boolean(),
    sukkaBalcony: z.boolean(),
    elevator: z.boolean(),
    view: z.boolean(),
    parentalUnit: z.boolean(),
    housingUnit: z.boolean(),
    yard: z.boolean(),
    garden: z.boolean(),
    frontFacing: z.boolean(),
    upgradedKitchen: z.boolean(),
    accessibleForDisabled: z.boolean(),
    airConditioning: z.boolean(),
    hasOption: z.boolean(),
  }),
});

export const residentialStep4Schema = z.object({
  description: z.string()
    .max(1200, 'התיאור חייב להיות עד 1200 תווים')
    .optional(),
  images: z.array(z.object({
    url: z.string(),
    file: z.any().optional(),
    isPrimary: z.boolean(),
    order: z.number(),
  })).max(15, 'מקסימום 15 תמונות').optional(),
  floorPlan: z.any().optional(),
});

export const residentialStep5Schema = z.object({
  contactName: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
  agreeToTerms: z.boolean().refine(val => val === true, 'יש לאשר את תנאי השימוש'),
  weeklyDigestOptIn: z.boolean().optional(),
});

// Shared Ownership Schemas
export const sharedOwnershipStep1Schema = z.object({
  hasBroker: z.boolean(),
});

export const sharedOwnershipStep2Schema = z.object({
  cityId: z.string().min(1, 'יש לבחור עיר'),
  cityName: z.string(),
  streetId: z.string().optional(),
  streetName: z.string().optional(),
  neighborhoodId: z.string().optional(),
  neighborhoodName: z.string().min(1, 'יש לבחור שכונה'),
  houseNumber: z.number().int('מספר בית חייב להיות מספר שלם').positive('מספר בית חייב להיות חיובי').optional(),
  addressSupplement: z.string().optional(),
}).refine((data) => data.streetId || data.neighborhoodName, {
  message: 'יש להזין רחוב או שכונה',
  path: ['neighborhoodName'],
});

export const sharedOwnershipStep3Schema = z.object({
  propertyType: z.nativeEnum(PropertyType),
  rooms: z.number().min(0.5, 'מספר חדרים מינימלי הוא 0.5'),
  squareMeters: z.number().positive('השטח חייב להיות חיובי').optional(),
  condition: z.nativeEnum(PropertyCondition).optional(),
  floor: z.union([z.number(), z.string()]).optional(),
  balconies: z.number().min(0).max(3).optional(),
  priceRequested: z.number().positive('המחיר חייב להיות חיובי').optional(),
  arnona: z.number().min(0).optional(),
  vaad: z.number().min(0).optional(),
  requiredEquity: z.number().min(0, 'ההון העצמי חייב להיות חיובי').optional(),
  numberOfPartners: z.number().int('מספר שותפים חייב להיות מספר שלם').min(1, 'מינימום שותף אחד').optional(),
  entryDate: z.string().optional(),
  features: z.object({
    parking: z.boolean(),
    storage: z.boolean(),
    view: z.boolean(),
    airConditioning: z.boolean(),
    sukkaBalcony: z.boolean(),
    safeRoom: z.boolean(),
    parentalUnit: z.boolean(),
    elevator: z.boolean(),
    yard: z.boolean(),
    garden: z.boolean(),
    frontFacing: z.boolean(),
    upgradedKitchen: z.boolean(),
    accessibleForDisabled: z.boolean(),
  }),
});

export const sharedOwnershipStep4Schema = z.object({
  description: z.string()
    .max(1200, 'התיאור חייב להיות עד 1200 תווים')
    .optional(),
  images: z.array(z.object({
    url: z.string(),
    file: z.any().optional(),
    isPrimary: z.boolean(),
    order: z.number(),
  })).max(15, 'מקסימום 15 תמונות').optional(),
  floorPlan: z.any().optional(),
});

export const sharedOwnershipStep5Schema = z.object({
  contactName: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
  weeklyDigestOptIn: z.boolean().optional(),
});


// Holiday Schemas
export const holidayStep1Schema = z.object({
  isOffering: z.boolean(),
  occasionType: z.enum(['SHABBAT', 'HOLIDAY', 'PACKAGE']),
});

export const holidayStep5Schema = z.object({
  contactName: z.string().min(1, 'יש להזין שם'),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
  agreeToTerms: z.boolean().refine(val => val === true, 'יש לאשר את תנאי השימוש'),
});

// Holiday Rent Schemas (New - for Shabbat Apartments)
export const holidayRentStep1Schema = z.object({
  cityId: z.string().min(1, 'יש לבחור עיר'),
  cityName: z.string(),
  streetId: z.string().optional(),
  streetName: z.string().optional(),
  neighborhoodId: z.string().optional(),
  neighborhoodName: z.string().min(1, 'יש לבחור או להזין שכונה'),
  houseNumber: z.number().optional(),
}).refine(
  (data) => data.streetId || data.neighborhoodName,
  {
    message: 'יש לבחור רחוב או להזין שכונה',
    path: ['neighborhoodName'],
  }
);

export const holidayRentStep2Schema = z.object({
  isPaid: z.boolean(),
});

export const holidayRentStep3Schema = z.object({
  parasha: z.string().min(1, 'יש לבחור פרשה'),
  propertyType: z.nativeEnum(PropertyType, { errorMap: () => ({ message: 'יש לבחור סוג נכס' }) }),
  rooms: z.number().min(0.5, 'מספר חדרים מינימלי הוא 0.5').max(10, 'מקסימום 10 חדרים'),
  purpose: z.enum(['HOSTING', 'SLEEPING_ONLY'], { errorMap: () => ({ message: 'יש לבחור מטרה' }) }),
  floor: z.union([z.number(), z.string()]).optional(),
  balconiesCount: z.number().min(0).max(3),
  beds: z.number().positive('מספר מיטות חייב להיות חיובי').optional(),
  priceRequested: z.number().positive('המחיר חייב להיות חיובי').optional().or(z.literal(undefined)),
  features: z.object({
    plata: z.boolean(),
    urn: z.boolean(),
    view: z.boolean(),
    linens: z.boolean(),
    ac: z.boolean(),
    balcony: z.boolean(),
    pool: z.boolean(),
    yard: z.boolean(),
    kidsGames: z.boolean(),
    babyBed: z.boolean(),
    masterUnit: z.boolean(),
    sleepingOnly: z.boolean(),
    accessibleForDisabled: z.boolean(),
  }),
});

export const holidayRentStep4Schema = z.object({
  contactName: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
  sendCopyToEmail: z.boolean().optional(),
});

// Project Schema
export const projectSchema = z.object({
  projectName: z.string().min(1, 'יש להזין שם פרויקט'),
  projectType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'MIXED']),
  cityId: z.string().min(1, 'יש לבחור עיר'),
  location: z.string().min(1, 'יש להזין מיקום'),
  status: z.nativeEnum(ProjectStatus),
  priceFrom: z.number().optional(),
  priceTo: z.number().optional(),
  constructionCompany: z.string().min(1, 'יש להזין חברת בניה'),
  description: z.string().min(10, 'התיאור חייב להכיל לפחות 10 תווים'),
  contactName: z.string().min(1, 'יש להזין שם'),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
  agreeToTerms: z.boolean().refine(val => val === true, 'יש לאשר את תנאי השימוש'),
});

// Commercial Schema
export const commercialSchema = z.object({
  propertyType: z.nativeEnum(CommercialPropertyType),
  cityId: z.string().min(1, 'יש לבחור עיר'),
  streetId: z.string().min(1, 'יש לבחור רחוב'),
  houseNumber: z.string().min(1, 'יש להזין מספר בית').regex(/^\d+$/, 'יש להזין מספר בלבד'),
  squareMeters: z.number().min(1, 'יש להזין שטח'),
  floor: z.number(),
  streetFront: z.boolean(),
  divisible: z.boolean(),
  price: z.number().min(1, 'יש להזין מחיר'),
  isForRent: z.boolean(),
  features: z.object({
    parking: z.boolean(),
    elevator: z.boolean(),
    businessLicense: z.boolean(),
  }),
  description: z.string().min(10, 'התיאור חייב להכיל לפחות 10 תווים'),
  contactName: z.string().min(1, 'יש להזין שם'),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
  agreeToTerms: z.boolean().refine(val => val === true, 'יש לאשר את תנאי השימוש'),
});

// Job Schema
export const jobSchema = z.object({
  jobTitle: z.string().min(1, 'יש להזין כותרת משרה'),
  jobType: z.nativeEnum(JobType),
  field: z.string().min(1, 'יש לבחור תחום'),
  description: z.string().min(10, 'התיאור חייב להכיל לפחות 10 תווים'),
  requirements: z.string().min(1, 'יש להזין דרישות'),
  cityId: z.string().min(1, 'יש לבחור עיר'),
  neighborhood: z.string().optional(),
  salaryRange: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
  contactEmail: z.string().email('כתובת מייל לא תקינה').optional().or(z.literal('')),
  externalLink: z.string().url('קישור לא תקין').optional().or(z.literal('')),
  agreeToTerms: z.boolean().refine(val => val === true, 'יש לאשר את תנאי השימוש'),
});
// ======================
// Wanted (מחפש) Types
// ======================

// Wanted For Sale - מחפש לקנות דירה
export interface WantedForSaleStep1Data {
  hasBroker?: boolean;
}

export interface WantedForSaleStep2Data {
  desiredStreet: string; // Free text
}

export interface WantedForSaleStep3Data {
  propertyType?: PropertyType;
  rooms?: number;
  squareMeters?: number;
  floor?: number;
  balconies?: number;
  condition?: PropertyCondition;
  furniture?: FurnitureStatus;
  features: {
    parking: boolean;
    storage: boolean;
    view: boolean;
    airConditioning: boolean;
    sukkaBalcony: boolean;
    parentalUnit: boolean;
    safeRoom: boolean;
    yard: boolean;
    housingUnit: boolean;
    elevator: boolean;
    hasOption: boolean;
    garden: boolean;
    frontFacing: boolean;
    upgradedKitchen: boolean;
    accessibleForDisabled: boolean;
  };
  priceRequested?: number;
  arnona?: number;
  vaad?: number;
  entryDate?: string;
  description?: string;
}

export interface WantedForSaleStep4Data {
  contactName?: string;
  contactPhone: string;
  sendCopyToEmail?: boolean;
}

export interface WantedForSaleWizardData {
  adType: AdType.WANTED_FOR_SALE;
  step1: WantedForSaleStep1Data;
  step2: WantedForSaleStep2Data;
  step3: WantedForSaleStep3Data;
  step4: WantedForSaleStep4Data;
}

// Wanted For Rent - מחפש לשכור דירה
export interface WantedForRentStep1Data {
  hasBroker?: boolean;
}

export interface WantedForRentStep2Data {
  desiredStreet: string; // Free text
}

export interface WantedForRentStep3Data {
  propertyType?: PropertyType;
  rooms?: number;
  squareMeters?: number;
  floor?: number;
  balconies?: number;
  condition?: PropertyCondition;
  furniture?: FurnitureStatus;
  features: {
    parking: boolean;
    storage: boolean;
    view: boolean;
    airConditioning: boolean;
    sukkaBalcony: boolean;
    safeRoom: boolean;
    parentalUnit: boolean;
    elevator: boolean;
    yard: boolean;
    garden: boolean;
    frontFacing: boolean;
    upgradedKitchen: boolean;
    accessibleForDisabled: boolean;
    housingUnit: boolean;
    hasOption: boolean;
  };
  priceRequested?: number;
  arnona?: number;
  vaad?: number;
  entryDate?: string;
  description?: string;
}

export interface WantedForRentStep4Data {
  contactName?: string;
  contactPhone: string;
  sendCopyToEmail?: boolean;
}

export interface WantedForRentWizardData {
  adType: AdType.WANTED_FOR_RENT;
  step1: WantedForRentStep1Data;
  step2: WantedForRentStep2Data;
  step3: WantedForRentStep3Data;
  step4: WantedForRentStep4Data;
}

// Wanted Holiday - מחפש דירה לשבת
export interface WantedHolidayStep1Data {
  desiredArea: string; // Free text
}

export interface WantedHolidayStep2Data {
  isPaid?: boolean;
}

export interface WantedHolidayStep3Data {
  parasha: string;
  propertyType?: PropertyType;
  rooms?: number;
  purpose: 'HOSTING' | 'SLEEPING_ONLY';
  floor: number;
  balconiesCount: number;
  beds?: number;
  priceRequested?: number;
  description?: string;
  features: {
    plata: boolean;
    urn: boolean;
    view: boolean;
    linens: boolean;
    ac: boolean;
    balcony: boolean;
    pool: boolean;
    yard: boolean;
    kidsGames: boolean;
    babyBed: boolean;
    masterUnit: boolean;
    sleepingOnly: boolean;
  };
}

export interface WantedHolidayStep4Data {
  contactName?: string;
  contactPhone: string;
  sendCopyToEmail?: boolean;
}

export interface WantedHolidayWizardData {
  adType: AdType.WANTED_HOLIDAY;
  step1: WantedHolidayStep1Data;
  step2: WantedHolidayStep2Data;
  step3: WantedHolidayStep3Data;
  step4: WantedHolidayStep4Data;
}

// Wanted Validation Schemas
export const wantedForSaleStep1Schema = z.object({
  hasBroker: z.boolean().optional(),
});

export const wantedForSaleStep2Schema = z.object({
  desiredStreet: z.string().min(1, 'יש להזין רחוב/אזור מבוקש'),
});

export const wantedForSaleStep3Schema = z.object({
  propertyType: z.nativeEnum(PropertyType).optional(),
  rooms: z.number().min(0.5, 'מספר חדרים מינימלי הוא 0.5').max(10, 'מקסימום 10 חדרים').optional(),
  squareMeters: z.number().positive('השטח חייב להיות חיובי').optional(),
  floor: z.number().optional(),
  balconies: z.number().min(0).max(3).optional(),
  condition: z.nativeEnum(PropertyCondition).optional(),
  furniture: z.nativeEnum(FurnitureStatus).optional(),
  features: z.object({
    parking: z.boolean(),
    storage: z.boolean(),
    view: z.boolean(),
    airConditioning: z.boolean(),
    sukkaBalcony: z.boolean(),
    parentalUnit: z.boolean(),
    safeRoom: z.boolean(),
    yard: z.boolean(),
    housingUnit: z.boolean(),
    elevator: z.boolean(),
    hasOption: z.boolean(),
    garden: z.boolean(),
    frontFacing: z.boolean(),
    upgradedKitchen: z.boolean(),
    accessibleForDisabled: z.boolean(),
  }),
  priceRequested: z.number().positive('המחיר חייב להיות חיובי').optional(),
  arnona: z.number().min(0).optional(),
  vaad: z.number().min(0).optional(),
  entryDate: z.string().optional(),
  description: z.string().max(500, 'התיאור חייב להיות עד 500 תווים').optional(),
});

export const wantedForSaleStep4Schema = z.object({
  contactName: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
  sendCopyToEmail: z.boolean().optional(),
});

export const wantedForRentStep1Schema = z.object({
  hasBroker: z.boolean().optional(),
});

export const wantedForRentStep2Schema = z.object({
  desiredStreet: z.string().min(1, 'יש להזין רחוב/אזור מבוקש'),
});

export const wantedForRentStep3Schema = z.object({
  propertyType: z.nativeEnum(PropertyType).optional(),
  rooms: z.number().min(0.5, 'מספר חדרים מינימלי הוא 0.5').max(10, 'מקסימום 10 חדרים').optional(),
  squareMeters: z.number().positive('השטח חייב להיות חיובי').optional(),
  floor: z.number().optional(),
  balconies: z.number().min(0).max(3).optional(),
  condition: z.nativeEnum(PropertyCondition).optional(),
  furniture: z.nativeEnum(FurnitureStatus).optional(),
  features: z.object({
    parking: z.boolean(),
    storage: z.boolean(),
    view: z.boolean(),
    airConditioning: z.boolean(),
    sukkaBalcony: z.boolean(),
    safeRoom: z.boolean(),
    parentalUnit: z.boolean(),
    elevator: z.boolean(),
    yard: z.boolean(),
    garden: z.boolean(),
    frontFacing: z.boolean(),
    upgradedKitchen: z.boolean(),
    accessibleForDisabled: z.boolean(),
    housingUnit: z.boolean(),
    hasOption: z.boolean(),
  }),
  priceRequested: z.number().positive('המחיר חייב להיות חיובי').optional(),
  arnona: z.number().min(0).optional(),
  vaad: z.number().min(0).optional(),
  entryDate: z.string().optional(),
  description: z.string().max(500, 'התיאור חייב להיות עד 500 תווים').optional(),
});

export const wantedForRentStep4Schema = z.object({
  contactName: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
  sendCopyToEmail: z.boolean().optional(),
});

export const wantedHolidayStep1Schema = z.object({
  desiredArea: z.string().min(1, 'יש להזין אזור/שכונה/רחוב מבוקש'),
});

export const wantedHolidayStep2Schema = z.object({
  isPaid: z.boolean().optional(),
});

export const wantedHolidayStep3Schema = z.object({
  parasha: z.string().min(1, 'יש לבחור פרשה'),
  propertyType: z.nativeEnum(PropertyType).optional(),
  rooms: z.number().min(0.5, 'מספר חדרים מינימלי הוא 0.5').max(10, 'מקסימום 10 חדרים').optional(),
  purpose: z.enum(['HOSTING', 'SLEEPING_ONLY']),
  floor: z.number(),
  balconiesCount: z.number().min(0).max(3),
  beds: z.number().positive('מספר מיטות חייב להיות חיובי').optional(),
  priceRequested: z.number().positive('המחיר חייב להיות חיובי').optional().or(z.literal(undefined)),
  description: z.string().max(500, 'התיאור חייב להיות עד 500 תווים').optional(),
  features: z.object({
    plata: z.boolean(),
    urn: z.boolean(),
    view: z.boolean(),
    linens: z.boolean(),
    ac: z.boolean(),
    balcony: z.boolean(),
    pool: z.boolean(),
    yard: z.boolean(),
    kidsGames: z.boolean(),
    babyBed: z.boolean(),
    masterUnit: z.boolean(),
    sleepingOnly: z.boolean(),
  }),
});

export const wantedHolidayStep4Schema = z.object({
  contactName: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
  sendCopyToEmail: z.boolean().optional(),
});
