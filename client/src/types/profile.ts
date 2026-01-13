export interface UserPreferences {
  weeklyDigest: boolean;
  notifyNewMatches: boolean;
  filters?: NewsletterFilters | null;
}

export interface NewsletterFilters {
  regions?: string[];
  categories?: string[];
  priceRange?: {
    min: number | null;
    max: number | null;
  };
  propertyTypes?: string[];
  publisherType?: 'OWNER' | 'BROKER';
}

export interface UpdatePreferencesInput {
  weeklyDigest?: boolean;
  notifyNewMatches?: boolean;
  filters?: Partial<NewsletterFilters>;
}

export interface MyAd {
  id: string;
  adNumber: number;
  title: string;
  category: string;
  status: string;
  views: number;
  createdAt: string;
  price?: number;
  address?: string;
  cityName?: string;
  streetName?: string;
  imageUrl?: string;
}

export interface MyAdsResponse {
  ads: MyAd[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FavoriteAd {
  id: string;
  adId: string;
  adNumber: number;
  title: string;
  category: string;
  price?: number;
  cityName?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface PersonalDetails {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: string;
  avatar?: string;
  companyName?: string;
  brokerLogoApproved?: boolean;
  createdAt: string;
}

export interface UpdatePersonalDetailsInput {
  name?: string;
  phone?: string;
}

export interface Appointment {
  id: string;
  startsAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
  notes?: string;
  ad: {
    id: string;
    adNumber: number;
    title: string;
    address?: string;
  };
}

export interface CreateAppointmentInput {
  adId: string;
  startsAt: string;
  notes?: string;
}
