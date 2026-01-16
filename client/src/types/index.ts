export type ServiceProviderType = 
  | 'BROKER'
  | 'LAWYER'
  | 'APPRAISER'
  | 'DESIGNER_ARCHITECT'
  | 'MORTGAGE_ADVISOR';

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'USER' | 'BROKER' | 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR' | 'SERVICE_PROVIDER';
  isAdmin: boolean;
  isBroker: boolean;
  isServiceProvider?: boolean;
  avatar?: string;
  companyName?: string;
  licenseNumber?: string;
  description?: string;
  website?: string;
  emailVerified?: boolean;
  createdAt: string;
  // Service provider fields
  userType?: 'USER' | 'SERVICE_PROVIDER';
  firstName?: string;
  lastName?: string;
  phonePersonal?: string;
  serviceProviderType?: ServiceProviderType;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  brokerLicenseNumber?: string;
  brokerCityId?: string;
  weeklyDigestOptIn?: boolean;
  // Additional Service Provider fields
  phoneBusinessOffice?: string;
  officeAddress?: string;
  officeAddressPending?: string;
  officeAddressStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  logoUrlPending?: string;
  logoStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  aboutBusiness?: string;
  aboutBusinessPending?: string;
  aboutBusinessStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  publishOfficeAddress?: boolean;
  businessHours?: BusinessHours;
  weeklyDigestSubscribed?: boolean;
}

export interface BusinessHours {
  sun?: TimeRange[];
  mon?: TimeRange[];
  tue?: TimeRange[];
  wed?: TimeRange[];
  thu?: TimeRange[];
  fri?: TimeRange[];
}

export interface TimeRange {
  from: string; // HH:mm format
  to: string;   // HH:mm format
}

export interface Category {
  id: string;
  name: string;
  nameHe: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  fields?: CategoryField[];
  order: number;
  isActive: boolean;
}

export interface CategoryField {
  id: string;
  categoryId: string;
  name: string;
  nameHe: string;
  fieldType: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';
  options?: string;
  isRequired: boolean;
  order: number;
}

export interface City {
  id: string;
  name: string;
  nameHe: string;
  slug: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface Street {
  id: string;
  name: string;
  nameHe?: string;
  cityId: string;
  city?: City;
  code?: string;
  neighborhoodId?: string;
  neighborhood?: {
    id: string;
    name: string;
    nameHe?: string;
  };
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  price?: number;
  adType?: string; // AdType enum: FOR_SALE, WANTED_FOR_SALE, etc.
  userId: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  categoryId: string;
  category: Category;
  cityId?: string;
  city?: City;
  streetId?: string;
  street?: Street;
  address?: string;
  latitude?: number;
  longitude?: number;
  
  // For wanted ads
  isWanted?: boolean;
  requestedLocationText?: string;
  
  images: AdImage[];
  customFields?: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  rejectionReason?: string;
  views: number;
  contactClicks: number;
  whatsappSent: boolean;
  whatsappSentAt?: string;
  expiresAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdImage {
  id: string;
  adId: string;
  url: string;
  order: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ServiceProviderRegistrationData {
  serviceProviderType: ServiceProviderType;
  firstName: string;
  lastName: string;
  phonePersonal: string;
  email: string;
  password: string;
  businessName: string;
  businessAddress: string;
  businessPhone?: string;
  website?: string;
  brokerLicenseNumber?: string;
  brokerCityId?: string;
  weeklyDigestOptIn: boolean;
  termsAccepted: boolean;
  declarationAccepted: boolean;
}
