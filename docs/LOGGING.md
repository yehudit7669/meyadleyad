# 📊 Logging & Monitoring Documentation - Meyadleyad Platform

## Overview
This document describes the comprehensive logging and monitoring system implemented in the Meyadleyad platform for production-ready observability, debugging, and performance optimization.

---

## 🎯 Features

### Logging
✅ **Structured JSON Logging** - All logs in JSON format for easy parsing  
✅ **Log Levels** - DEBUG, INFO, WARN, ERROR  
✅ **Sensitive Data Sanitization** - Automatic removal of passwords, tokens, PII  
✅ **Context-Rich Logs** - Metadata for better debugging  
✅ **Environment-Aware** - Pretty print in dev, JSON in production  

### Performance Monitoring
✅ **Request/Response Timing** - Track every API call duration  
✅ **Slow Endpoint Detection** - Automatic flagging of slow routes  
✅ **Performance Statistics** - Real-time performance metrics  
✅ **Frontend Monitoring** - Page load, route changes, Web Vitals  

### Error Tracking
✅ **Sentry Integration Ready** - Environment-based error tracking  
✅ **Error Context** - Rich error metadata for debugging  
✅ **User Context** - Track errors by user  
✅ **Breadcrumbs** - Debugging trail  

---

## 📝 Backend Logging

### Central Logger

**Location:** [server/src/utils/logger.ts](../server/src/utils/logger.ts)

#### Basic Usage

```typescript
import { logger } from './utils/logger';

// Debug (only in development)
logger.debug('Debug message', { key: 'value' });

// Info
logger.info('User logged in', { userId: '123', email: 'user@example.com' });

// Warning
logger.warn('Rate limit approaching', { remaining: 5, limit: 100 });

// Error
logger.error('Database connection failed', error, { context: 'startup' });
```

#### Specialized Logging Methods

```typescript
// HTTP Request
logger.request('GET', '/api/ads', { query: { page: 1 } });

// HTTP Response
logger.response('GET', '/api/ads', 200, 150); // method, url, status, duration

// Authentication
logger.auth('login', { userId: '123', method: 'email' });
logger.auth('logout', { userId: '123' });
logger.auth('password_reset', { email: 'user@example.com' });

// Admin Actions
logger.admin('ad_approved', { adId: '456', adminId: '789' });
logger.admin('user_banned', { userId: '123', reason: 'spam' });

// Database Operations
logger.database('SELECT', 'ads', 45, { query: 'active ads' });
logger.database('UPDATE', 'users', 1200, { userId: '123' }); // Slow query warning

// Email Events
logger.email('verification_sent', 'user@example.com', true);
logger.email('reset_password', 'user@example.com', false, { error: 'SMTP error' });

// WhatsApp Events
logger.whatsapp('ad_notification', '+972501234567', true);
logger.whatsapp('ad_notification', '+972501234567', false, { error: 'Invalid number' });

// PDF Generation
logger.pdf('newspaper_generated', true, 2500, { adCount: 50 });
logger.pdf('single_ad_pdf', false, undefined, { error: 'Puppeteer timeout' });
```

#### Log Output Formats

**Development (Pretty Print):**
```
[2026-01-01T20:00:00.000Z] INFO: User logged in
  Context: {
    "userId": "123",
    "email": "us***@ex*****.com"
  }
```

**Production (JSON):**
```json
{
  "timestamp": "2026-01-01T20:00:00.000Z",
  "level": "info",
  "message": "User logged in",
  "context": {
    "userId": "123",
    "email": "us***@ex*****.com"
  }
}
```

#### Sensitive Data Protection

The logger automatically sanitizes sensitive fields:

**Completely Removed:**
- `password`, `newPassword`, `oldPassword`
- `token`, `refreshToken`, `accessToken`
- `apiKey`, `secret`, `privateKey`
- `creditCard`, `cvv`, `ssn`

**Partially Masked:**
- `email` → `us***@ex*****.com`
- `phone` → `05********12`
- `licenseNumber` → `AB********YZ`

---

## ⚡ Performance Monitoring

### Backend Performance

**Location:** [server/src/middlewares/performanceMonitor.ts](../server/src/middlewares/performanceMonitor.ts)

#### Automatic Request Tracking

Every API request is automatically tracked:

```typescript
// Logs:
// → GET /api/ads (request start)
// GET /api/ads - 200 (150ms) (response with duration)
```

#### Performance Thresholds

```typescript
FAST: < 100ms       // ✓ Fast response
NORMAL: 100-500ms   // → Normal response  
SLOW: 500-1000ms    // ⚠️ Slow endpoint detected
CRITICAL: > 3000ms  // ❌ Critical slow endpoint
```

#### Slow Endpoint Detection

Automatically tracks and logs slow endpoints:

```typescript
logger.warn('Slow endpoint detected', {
  type: 'PERFORMANCE_SLOW',
  endpoint: 'GET /api/ads',
  duration: 750,
  statusCode: 200,
  threshold: 500
});
```

#### Performance Statistics API

Get real-time performance stats:

```typescript
import { getPerformanceStats } from './middlewares/performanceMonitor';

const stats = getPerformanceStats();
// Returns:
{
  slowEndpoints: [
    {
      endpoint: 'GET /api/ads',
      count: 25,
      avgDuration: 850,
      totalDuration: 21250
    }
  ]
}
```

**Admin Endpoint:** `GET /api/admin/performance-stats`

### Frontend Performance

**Location:** [client/src/utils/performanceMonitoring.ts](../client/src/utils/performanceMonitoring.ts)

#### Initialize Monitoring

```typescript
import { initPerformanceMonitoring } from './utils/performanceMonitoring';

// In main.tsx or App.tsx
initPerformanceMonitoring();
```

#### Track Route Changes

```typescript
import { usePerformanceMonitoring } from './utils/performanceMonitoring';
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();
  const trackRoute = usePerformanceMonitoring();
  
  useEffect(() => {
    trackRoute(location.pathname);
  }, [location]);
}
```

#### Performance Metrics

```typescript
import { getPageLoadMetrics, getRouteChangeStats } from './utils/performanceMonitoring';

// Page load metrics
const metrics = getPageLoadMetrics();
// Returns:
{
  pageLoad: 1250,
  domContentLoaded: 800,
  firstPaint: 600,
  firstContentfulPaint: 750,
  largestContentfulPaint: 1100
}

// Route change statistics
const stats = getRouteChangeStats();
// Returns:
{
  count: 45,
  avgDuration: 120,
  slowRoutes: [
    { from: '/ads', to: '/ads/123', duration: 450, timestamp: 1234567890 }
  ]
}
```

#### Web Vitals Tracking

Automatically tracks Core Web Vitals:
- **LCP** (Largest Contentful Paint) - < 2.5s
- **FCP** (First Contentful Paint) - < 1.8s
- **TTI** (Time to Interactive) - < 3.8s

---

## 🔍 Error Tracking

### Backend Error Tracking

**Location:** [server/src/utils/errorTracking.ts](../server/src/utils/errorTracking.ts)

#### Setup (when ready for Sentry)

```bash
# Install Sentry
npm install @sentry/node @sentry/profiling-node

# Add to .env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

#### Usage

```typescript
import { captureError, captureMessage } from './utils/errorTracking';

// Capture exception
try {
  await riskyOperation();
} catch (error) {
  captureError(error as Error, {
    userId: user.id,
    tags: { operation: 'riskyOperation' },
    extra: { context: 'additional data' }
  });
}

// Capture message
captureMessage('Payment processing started', 'info', {
  userId: user.id,
  tags: { payment: 'stripe' }
});
```

#### Automatic Error Tracking

All unhandled errors are automatically captured:

```typescript
// In app.ts
import { errorTrackingMiddleware } from './utils/errorTracking';

app.use(errorTrackingMiddleware); // Before error handler
```

### Frontend Error Tracking

**Location:** [client/src/utils/errorTracking.ts](../client/src/utils/errorTracking.ts)

#### Setup (when ready for Sentry)

```bash
# Install Sentry
npm install @sentry/react

# Add to .env
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

#### Initialize

```typescript
import { initErrorTracking } from './utils/errorTracking';

// In main.tsx
initErrorTracking();
```

#### Usage

```typescript
import { 
  captureException, 
  captureMessage, 
  setUserContext,
  clearUserContext,
  addBreadcrumb 
} from './utils/errorTracking';

// Capture exception
try {
  await fetchData();
} catch (error) {
  captureException(error as Error, {
    userId: user.id,
    tags: { component: 'AdList' }
  });
}

// Set user context (on login)
setUserContext({
  id: user.id,
  email: user.email,
  name: user.name
});

// Clear context (on logout)
clearUserContext();

// Add breadcrumb for debugging
addBreadcrumb('navigation', 'User clicked "Create Ad"', {
  from: '/ads',
  to: '/ads/new'
});
```

---

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```bash
# Logging
NODE_ENV=production              # 'development' or 'production'
LOG_LEVEL=info                   # 'debug', 'info', 'warn', 'error'

# Error Tracking (Optional)
SENTRY_DSN=                      # Sentry DSN for backend
SENTRY_FRONTEND_DSN=             # Sentry DSN for frontend
```

**Frontend (.env):**
```bash
# Error Tracking (Optional)
VITE_SENTRY_DSN=                 # Sentry DSN for frontend
```

---

## 📊 Log Categories

### Request/Response Logs
```json
{
  "timestamp": "2026-01-01T20:00:00.000Z",
  "level": "info",
  "message": "GET /api/ads - 200 (150ms)",
  "context": {
    "type": "HTTP_RESPONSE",
    "method": "GET",
    "url": "/api/ads",
    "statusCode": 200,
    "duration": 150
  }
}
```

### Authentication Logs
```json
{
  "timestamp": "2026-01-01T20:00:00.000Z",
  "level": "info",
  "message": "Auth: login",
  "context": {
    "type": "AUTH_EVENT",
    "event": "login",
    "userId": "123",
    "email": "us***@ex*****.com"
  }
}
```

### Performance Logs
```json
{
  "timestamp": "2026-01-01T20:00:00.000Z",
  "level": "warn",
  "message": "Slow endpoint detected",
  "context": {
    "type": "PERFORMANCE_SLOW",
    "endpoint": "GET /api/ads",
    "duration": 750,
    "statusCode": 200
  }
}
```

### Error Logs
```json
{
  "timestamp": "2026-01-01T20:00:00.000Z",
  "level": "error",
  "message": "Database connection failed",
  "context": {
    "errorName": "PrismaClientInitializationError",
    "errorMessage": "Can't reach database",
    "context": "startup"
  },
  "stack": "Error: Can't reach database\n    at ..."
}
```

---

## 🎯 Best Practices

### DO ✅

1. **Use appropriate log levels**
   ```typescript
   logger.debug('Debugging info'); // Development only
   logger.info('Normal operation'); // General info
   logger.warn('Unexpected but handled'); // Warnings
   logger.error('Actual errors'); // Errors only
   ```

2. **Include context**
   ```typescript
   logger.info('User created ad', {
     userId: user.id,
     adId: ad.id,
     categoryId: ad.categoryId
   });
   ```

3. **Log business-critical events**
   ```typescript
   logger.admin('ad_approved', { adId, adminId });
   logger.email('verification_sent', email, success);
   ```

4. **Track performance**
   ```typescript
   const start = Date.now();
   await operation();
   const duration = Date.now() - start;
   logger.database('SELECT', 'ads', duration);
   ```

### DON'T ❌

1. **Don't log sensitive data**
   ```typescript
   // ❌ BAD
   logger.info('User logged in', { password: '123456' });
   
   // ✅ GOOD (auto-sanitized anyway)
   logger.auth('login', { userId: user.id });
   ```

2. **Don't log in loops**
   ```typescript
   // ❌ BAD
   ads.forEach(ad => logger.debug('Processing ad', { adId: ad.id }));
   
   // ✅ GOOD
   logger.info('Processing ads', { count: ads.length });
   ```

3. **Don't log too verbosely**
   ```typescript
   // ❌ BAD
   logger.info('Starting operation');
   logger.info('Step 1 complete');
   logger.info('Step 2 complete');
   
   // ✅ GOOD
   logger.info('Operation complete', { steps: 2, duration: 150 });
   ```

---

## 📈 Monitoring Dashboard

### Real-Time Metrics

**Admin Performance Stats:**
```
GET /api/admin/performance-stats

Response:
{
  "status": "success",
  "data": {
    "thresholds": {
      "FAST": 100,
      "NORMAL": 500,
      "SLOW": 1000,
      "CRITICAL": 3000
    },
    "slowEndpoints": [
      {
        "endpoint": "GET /api/ads",
        "count": 25,
        "avgDuration": 850,
        "totalDuration": 21250
      }
    ]
  }
}
```

### Log Analysis

For production, logs can be sent to:
- **CloudWatch** (AWS)
- **Datadog** (APM)
- **New Relic** (APM)
- **Elasticsearch** (ELK Stack)
- **Splunk** (Enterprise)

All logs are in JSON format for easy ingestion.

---

## 🔧 Troubleshooting

### High Log Volume

If logs are too verbose in production:

```typescript
// Adjust log level
NODE_ENV=production LOG_LEVEL=warn
```

### Missing Logs

Check middleware order in `app.ts`:
```typescript
// ✅ CORRECT ORDER
app.use(express.json()); // Body parser first
app.use(performanceMonitor); // Performance tracking
app.use(requestLogger); // Request logging
app.use('/api', routes); // Routes
app.use(errorTrackingMiddleware); // Error tracking
app.use(errorHandler); // Error handler last
```

### Performance Issues

If performance monitoring adds overhead:
```typescript
// Skip certain routes
if (path.startsWith('/health') || path.startsWith('/uploads/')) {
  return next();
}
```

---

## 📚 References

- [Structured Logging Best Practices](https://www.structlog.org/)
- [Web Vitals Documentation](https://web.dev/vitals/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

---

**Last Updated:** January 1, 2026  
**Maintained by:** Development Team  
**Contact:** devops@meyadleyad.com
