// Types for Notification System

export interface NotificationFilters {
  categoryIds?: string[];
  cityIds?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  propertyTypes?: string[];
  publisherTypes?: ('OWNER' | 'BROKER')[];
}

export interface UserPreferences {
  weeklyDigest: boolean;
  notifyNewMatches: boolean;
  filters?: NotificationFilters;
}

export interface NotificationSettings {
  id: string;
  enabled: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface UserNotificationOverride {
  id: string;
  userId: string;
  mode: 'ALLOW' | 'BLOCK';
  expiresAt: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationQueueItem {
  id: string;
  userId: string;
  adId: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}
