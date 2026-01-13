import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().optional(),
    role: z.enum(['USER', 'BROKER']).optional(),
    // Broker specific fields
    companyName: z.string().optional(),
    licenseNumber: z.string().optional(),
  }),
});

export const registerServiceProviderSchema = z.object({
  body: z.object({
    serviceProviderType: z.enum([
      'BROKER',
      'LAWYER',
      'APPRAISER',
      'DESIGNER_ARCHITECT',
      'MORTGAGE_ADVISOR',
    ], { required_error: 'Service provider type is required' }),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phonePersonal: z.string().min(9, 'Phone number is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    businessName: z.string().min(2, 'Business name is required'),
    businessAddress: z.string().min(5, 'Business address is required'),
    businessPhone: z.string().optional(),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    brokerLicenseNumber: z.string().optional(),
    brokerCityId: z.string().optional(),
    weeklyDigestOptIn: z.boolean().default(true),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
    declarationAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the declaration',
    }),
  }).refine(
    (data) => {
      // אם נבחר מתווך, חייב מספר רישיון ועיר
      if (data.serviceProviderType === 'BROKER') {
        return data.brokerLicenseNumber && data.brokerCityId;
      }
      return true;
    },
    {
      message: 'Broker license number and city are required for brokers',
      path: ['brokerLicenseNumber'],
    }
  ),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const googleAuthSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Google token is required'),
  }),
});
