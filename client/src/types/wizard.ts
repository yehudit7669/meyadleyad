import { z } from 'zod';

// ======================
// Ad Type Enums
// ======================

export enum AdType {
  FOR_SALE = 'FOR_SALE',
  FOR_RENT = 'FOR_RENT',
  UNIT = 'UNIT',
  HOLIDAY_RENT = 'HOLIDAY_RENT',
  SERVICE_PROVIDERS = 'SERVICE_PROVIDERS',
  PROJECT = 'PROJECT',
  COMMERCIAL = 'COMMERCIAL',
  JOB = 'JOB',
  WANTED_FOR_SALE = 'WANTED_FOR_SALE',
  WANTED_FOR_RENT = 'WANTED_FOR_RENT',
  WANTED_HOLIDAY = 'WANTED_HOLIDAY',
  WANTED_COMMERCIAL = 'WANTED_COMMERCIAL',
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  DUPLEX = 'DUPLEX',
  GARDEN_APARTMENT = 'GARDEN_APARTMENT',
  PRIVATE_HOUSE = 'PRIVATE_HOUSE',
  UNIT = 'UNIT',
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
  streetId: string;
  streetName: string;
  neighborhoodId: string;
  neighborhoodName: string;
  houseNumber: number;
  addressSupplement?: string;
}

export interface ResidentialStep3Data {
  propertyType: PropertyType;
  rooms: number;
  squareMeters: number;
  condition: PropertyCondition;
  floor: number;
  balconies: number;
  furniture: FurnitureStatus;
  entryDate: string;
  price: number;
  arnona: number;
  vaad: number;
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
// Holiday (Shabbat) Types - Updated
// ======================

export interface HolidayRentStep1Data {
  cityId: string;
  cityName: string;
  streetId: string;
  streetName: string;
  neighborhoodId: string;
  neighborhoodName: string;
  houseNumber: number;
}

export interface HolidayRentStep2Data {
  isPaid: boolean;
}

export interface HolidayRentStep3Data {
  parasha: string;
  propertyType: PropertyType;
  rooms: number;
  purpose: 'HOSTING' | 'SLEEPING_ONLY';
  floor: number;
  balconiesCount: number;
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
  };
}

export interface HolidayRentStep4Data {
  contactName?: string;
  contactPhone: string;
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
const phoneRegex = /^0(5[0-9]|[2-4]|[8-9])[0-9]{7,8}$/;

// Residential Schemas
export const residentialStep1Schema = z.object({
  hasBroker: z.boolean(),
});

export const residentialStep2Schema = z.object({
  cityId: z.string().min(1, 'יש לבחור עיר'),
  cityName: z.string(),
  streetId: z.string().min(1, 'יש לבחור רחוב'),
  streetName: z.string(),
  neighborhoodId: z.string(),
  neighborhoodName: z.string(),
  houseNumber: z.number().int('מספר בית חייב להיות מספר שלם').positive('מספר בית חייב להיות חיובי'),
  addressSupplement: z.string().optional(),
});

export const residentialStep3Schema = z.object({
  propertyType: z.nativeEnum(PropertyType),
  rooms: z.number().min(1, 'יש לבחור מספר חדרים'),
  squareMeters: z.number().min(1, 'יש להזין שטח'),
  condition: z.nativeEnum(PropertyCondition),
  floor: z.number(),
  balconies: z.number().min(0).max(3),
  furniture: z.nativeEnum(FurnitureStatus),
  entryDate: z.string().min(1, 'יש לבחור תאריך כניסה').refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, 'תאריך הכניסה חייב להיות היום או בעתיד'),
  price: z.number().min(1, 'יש להזין מחיר'),
  arnona: z.number().min(0),
  vaad: z.number().min(0),
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
    airConditioning: z.boolean(),
    hasOption: z.boolean(),
  }),
});

export const residentialStep4Schema = z.object({
  description: z.string()
    .min(80, 'התיאור חייב להכיל לפחות 80 תווים')
    .max(1200, 'התיאור חייב להיות עד 1200 תווים'),
  images: z.array(z.object({
    url: z.string(),
    file: z.any().optional(),
    isPrimary: z.boolean(),
    order: z.number(),
  })).min(3, 'נדרשות לפחות 3 תמונות').max(15, 'מקסימום 15 תמונות'),
  floorPlan: z.any().optional(),
});

export const residentialStep5Schema = z.object({
  contactName: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
  agreeToTerms: z.boolean().refine(val => val === true, 'יש לאשר את תנאי השימוש'),
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
  streetId: z.string().min(1, 'יש לבחור רחוב'),
  streetName: z.string(),
  neighborhoodId: z.string(),
  neighborhoodName: z.string(),
  houseNumber: z.number().int('מספר בית חייב להיות מספר שלם').positive('מספר בית חייב להיות חיובי'),
});

export const holidayRentStep2Schema = z.object({
  isPaid: z.boolean(),
});

export const holidayRentStep3Schema = z.object({
  parasha: z.string().min(1, 'יש לבחור פרשה'),
  propertyType: z.nativeEnum(PropertyType, { errorMap: () => ({ message: 'יש לבחור סוג נכס' }) }),
  rooms: z.number().min(1, 'יש לבחור מספר חדרים').max(8, 'מקסימום 8 חדרים'),
  purpose: z.enum(['HOSTING', 'SLEEPING_ONLY'], { errorMap: () => ({ message: 'יש לבחור מטרה' }) }),
  floor: z.number(),
  balconiesCount: z.number().min(0).max(3),
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
  }),
});

export const holidayRentStep4Schema = z.object({
  contactName: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
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
  hasBroker: boolean;
}

export interface WantedForSaleStep2Data {
  desiredStreet: string; // Free text
}

export interface WantedForSaleStep3Data {
  propertyType: PropertyType;
  rooms: number;
  squareMeters: number;
  floor: number;
  balconies: number;
  condition: PropertyCondition;
  furniture: FurnitureStatus;
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
  };
  priceRequested: number;
  arnona: number;
  vaad: number;
  entryDate: string;
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
  hasBroker: boolean;
}

export interface WantedForRentStep2Data {
  desiredStreet: string; // Free text
}

export interface WantedForRentStep3Data {
  propertyType: PropertyType;
  rooms: number;
  squareMeters: number;
  floor: number;
  balconies: number;
  condition: PropertyCondition;
  furniture: FurnitureStatus;
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
  };
  priceRequested: number;
  arnona: number;
  vaad: number;
  entryDate: string;
}

export interface WantedForRentStep4Data {
  contactName?: string;
  contactPhone: string;
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
  isPaid: boolean;
}

export interface WantedHolidayStep3Data {
  parasha: string;
  propertyType: PropertyType;
  rooms: number;
  purpose: 'HOSTING' | 'SLEEPING_ONLY';
  floor: number;
  balconiesCount: number;
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
  };
}

export interface WantedHolidayStep4Data {
  contactName?: string;
  contactPhone: string;
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
  hasBroker: z.boolean(),
});

export const wantedForSaleStep2Schema = z.object({
  desiredStreet: z.string().min(1, 'יש להזין רחוב/אזור מבוקש'),
});

export const wantedForSaleStep3Schema = z.object({
  propertyType: z.nativeEnum(PropertyType),
  rooms: z.number().min(1, 'יש לבחור מספר חדרים').max(8),
  squareMeters: z.number().min(1, 'יש להזין שטח'),
  floor: z.number(),
  balconies: z.number().min(0).max(3),
  condition: z.nativeEnum(PropertyCondition),
  furniture: z.nativeEnum(FurnitureStatus),
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
  }),
  priceRequested: z.number().min(1, 'יש להזין מחיר מבוקש'),
  arnona: z.number().min(0),
  vaad: z.number().min(0),
  entryDate: z.string().min(1, 'יש לבחור תאריך כניסה רצוי').refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, 'תאריך הכניסה חייב להיות היום או בעתיד'),
});

export const wantedForSaleStep4Schema = z.object({
  contactName: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
  sendCopyToEmail: z.boolean().optional(),
});

export const wantedForRentStep1Schema = z.object({
  hasBroker: z.boolean(),
});

export const wantedForRentStep2Schema = z.object({
  desiredStreet: z.string().min(1, 'יש להזין רחוב/אזור מבוקש'),
});

export const wantedForRentStep3Schema = z.object({
  propertyType: z.nativeEnum(PropertyType),
  rooms: z.number().min(1, 'יש לבחור מספר חדרים').max(8),
  squareMeters: z.number().min(1, 'יש להזין שטח'),
  floor: z.number(),
  balconies: z.number().min(0).max(3),
  condition: z.nativeEnum(PropertyCondition),
  furniture: z.nativeEnum(FurnitureStatus),
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
  }),
  priceRequested: z.number().min(1, 'יש להזין מחיר מבוקש'),
  arnona: z.number().min(0),
  vaad: z.number().min(0),
  entryDate: z.string().min(1, 'יש לבחור תאריך כניסה רצוי').refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, 'תאריך הכניסה חייב להיות היום או בעתיד'),
});

export const wantedForRentStep4Schema = z.object({
  contactName: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
});

export const wantedHolidayStep1Schema = z.object({
  desiredArea: z.string().min(1, 'יש להזין אזור/שכונה/רחוב מבוקש'),
});

export const wantedHolidayStep2Schema = z.object({
  isPaid: z.boolean(),
});

export const wantedHolidayStep3Schema = z.object({
  parasha: z.string().min(1, 'יש לבחור פרשה'),
  propertyType: z.nativeEnum(PropertyType),
  rooms: z.number().min(1, 'יש לבחור מספר חדרים').max(8),
  purpose: z.enum(['HOSTING', 'SLEEPING_ONLY']),
  floor: z.number(),
  balconiesCount: z.number().min(0).max(3),
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
  }),
});

export const wantedHolidayStep4Schema = z.object({
  contactName: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין'),
});
