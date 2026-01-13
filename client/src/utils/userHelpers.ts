import { User } from '../types';

/**
 * Check if user is a broker
 */
export function isBroker(user: User | null | undefined): boolean {
  if (!user) return false;
  // Check both role and legacy isBroker flag for backward compatibility
  return user.role === 'BROKER' || user.isBroker === true;
}

/**
 * Check if user is a service provider (non-broker)
 */
export function isServiceProvider(user: User | null | undefined): boolean {
  if (!user) return false;
  // Service provider if role is SERVICE_PROVIDER OR userType is SERVICE_PROVIDER but NOT a broker
  return (
    (user.role === 'SERVICE_PROVIDER' && !isBroker(user)) ||
    (user.userType === 'SERVICE_PROVIDER' && !isBroker(user))
  );
}

/**
 * Check if user is a regular user (not broker, not service provider)
 */
export function isRegularUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return !isBroker(user) && !isServiceProvider(user);
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || user.isAdmin === true;
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return 'אורח';
  
  if (user.name) return user.name;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.businessName) return user.businessName;
  if (user.companyName) return user.companyName;
  
  return user.email.split('@')[0];
}
