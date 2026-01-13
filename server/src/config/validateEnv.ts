import { config } from './index';

/**
 * Environment Validation Utility
 * 
 * מוודא שכל משתני הסביבה הנדרשים קיימים ותקינים לפני הפעלת השרת
 */

interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'warning';
}

const errors: ValidationError[] = [];

/**
 * Validate required environment variables
 */
export function validateEnvironment(): { isValid: boolean; errors: ValidationError[] } {
  console.log('\n🔍 Validating environment configuration...\n');
  
  // Critical - Must have
  validateRequired('DATABASE_URL', config.database.url, 'critical');
  validateRequired('JWT_SECRET', config.jwt.secret, 'critical');
  validateRequired('JWT_REFRESH_SECRET', config.jwt.refreshSecret, 'critical');
  
  // Warn if using defaults
  if (config.jwt.secret === 'default-secret') {
    errors.push({
      field: 'JWT_SECRET',
      message: 'Using default JWT secret - INSECURE for production!',
      severity: 'critical',
    });
  }
  
  if (config.jwt.refreshSecret === 'default-refresh-secret') {
    errors.push({
      field: 'JWT_REFRESH_SECRET',
      message: 'Using default refresh secret - INSECURE for production!',
      severity: 'critical',
    });
  }
  
  // Validate JWT expiration format
  validateJwtExpiration('JWT_EXPIRES_IN', config.jwt.expiresIn);
  validateJwtExpiration('JWT_REFRESH_EXPIRES_IN', config.jwt.refreshExpiresIn);
  
  // Production-specific validations
  if (config.nodeEnv === 'production') {
    validateProductionSettings();
  }
  
  // Email configuration (warning only)
  if (!config.email.user || !config.email.password) {
    errors.push({
      field: 'EMAIL',
      message: 'Email configuration missing - Email features will not work',
      severity: 'warning',
    });
  }
  
  // WhatsApp configuration (warning only)
  if (!config.whatsapp.phoneNumberId || !config.whatsapp.accessToken) {
    errors.push({
      field: 'WHATSAPP',
      message: 'WhatsApp configuration missing - WhatsApp features will not work',
      severity: 'warning',
    });
  }
  
  // Google OAuth (warning only)
  if (!config.google.clientId || !config.google.clientSecret) {
    errors.push({
      field: 'GOOGLE_OAUTH',
      message: 'Google OAuth configuration missing - Google login will not work',
      severity: 'warning',
    });
  }
  
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  return {
    isValid: criticalErrors.length === 0,
    errors,
  };
}

/**
 * Validate required field
 */
function validateRequired(name: string, value: any, severity: 'critical' | 'warning') {
  if (!value || value === '') {
    errors.push({
      field: name,
      message: `${name} is required but not set`,
      severity,
    });
  }
}

/**
 * Validate JWT expiration format
 */
function validateJwtExpiration(name: string, value: string) {
  const validFormats = /^(\d+[smhd])$/;
  if (!validFormats.test(value)) {
    errors.push({
      field: name,
      message: `Invalid JWT expiration format: "${value}". Use format like "15m", "1h", "7d"`,
      severity: 'warning',
    });
  }
}

/**
 * Production-specific validations
 */
function validateProductionSettings() {
  // Client URL should not be localhost in production
  if (config.clientUrl.includes('localhost')) {
    errors.push({
      field: 'CLIENT_URL',
      message: 'CLIENT_URL is set to localhost in production environment!',
      severity: 'critical',
    });
  }
  
  // Rate limiting should be configured
  if (config.rateLimit.maxRequests > 1000) {
    errors.push({
      field: 'RATE_LIMIT_MAX_REQUESTS',
      message: 'Rate limit seems too high for production (>1000)',
      severity: 'warning',
    });
  }
  
  // File size limit check
  const maxFileSizeMB = config.upload.maxFileSize / (1024 * 1024);
  if (maxFileSizeMB > 10) {
    errors.push({
      field: 'MAX_FILE_SIZE',
      message: `Max file size is ${maxFileSizeMB}MB - consider reducing for production`,
      severity: 'warning',
    });
  }
}

/**
 * Display validation results
 */
export function displayValidationResults(validation: { isValid: boolean; errors: ValidationError[] }) {
  const { errors } = validation;
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  const warnings = errors.filter(e => e.severity === 'warning');
  
  if (criticalErrors.length === 0 && warnings.length === 0) {
    console.log('✅ All environment variables validated successfully!\n');
    return;
  }
  
  if (criticalErrors.length > 0) {
    console.log('❌ CRITICAL ERRORS:\n');
    criticalErrors.forEach(err => {
      console.log(`   - ${err.field}: ${err.message}`);
    });
    console.log();
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    warnings.forEach(warn => {
      console.log(`   - ${warn.field}: ${warn.message}`);
    });
    console.log();
  }
  
  if (criticalErrors.length > 0) {
    console.log('🛑 Cannot start server - please fix critical errors!\n');
  }
}

/**
 * Get environment summary for display
 */
export function getEnvironmentSummary() {
  return {
    nodeEnv: config.nodeEnv,
    port: config.port,
    database: config.database.url ? '✅ Connected' : '❌ Not configured',
    jwt: {
      accessTokenExpiry: config.jwt.expiresIn,
      refreshTokenExpiry: config.jwt.refreshExpiresIn,
      isSecure: config.jwt.secret !== 'default-secret',
    },
    email: config.email.user ? '✅ Configured' : '⚠️ Not configured',
    whatsapp: config.whatsapp.accessToken ? '✅ Configured' : '⚠️ Not configured',
    googleAuth: config.google.clientId ? '✅ Configured' : '⚠️ Not configured',
    rateLimit: {
      window: `${config.rateLimit.windowMs / 1000 / 60} minutes`,
      maxRequests: config.rateLimit.maxRequests,
    },
  };
}
