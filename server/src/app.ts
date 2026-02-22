import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/sanitizeLogger';
import { performanceMonitor } from './middlewares/performanceMonitor';
import { initErrorTracking, errorTrackingMiddleware } from './utils/errorTracking';
import { logger } from './utils/logger';

const app: Application = express();

// 🔥🔥🔥 TIMESTAMP TO VERIFY RELOAD
console.log('🔥🔥🔥 APP.TS LOADED AT:', new Date().toLocaleTimeString('he-IL'));

// Initialize error tracking (Sentry)
initErrorTracking(app);

// Security middleware - Helmet with production-ready configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // For inline styles (consider removing in production)
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'], // Allow images from HTTPS sources
        connectSrc: ["'self'", config.clientUrl],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  })
);

// CORS - Production-ready configuration
const allowedOrigins = [
  config.clientUrl,
  'https://amakom.co.il',
  'https://www.amakom.co.il',
  'http://161.97.75.192',
  'https://161.97.75.192',
  'http://localhost:3000', // Development
  'http://localhost:3001', // Vite dev server (alternative port)
  'http://localhost:5173', // Vite dev server
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma'],
    exposedHeaders: ['X-Total-Count'], // For pagination
    maxAge: 600, // 10 minutes
  })
);

// Rate limiting - Different limits for different routes
const generalLimiter = rateLimit({
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10),
  message: 'יותר מדי בקשות מכתובת ה-IP הזו, אנא נסה שוב מאוחר יותר.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

// Stricter rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '50', 10),
  message: 'יותר מדי ניסיונות התחברות, אנא נסה שוב מאוחר יותר.',
  skipSuccessfulRequests: true,
});

// Apply rate limiters
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Body parsers - Increased limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Performance monitoring (before request logger)
app.use(performanceMonitor);

// Request logging with sensitive data sanitization
// Apply after body parsers so we can log request bodies
app.use(requestLogger);

// 🔍 DEBUG: Log ALL POST/PUT requests
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('🔍 POST/PUT REQUEST:');
    console.log('   Method:', req.method);
    console.log('   Path:', req.path);
    console.log('   URL:', req.url);
    console.log('   Content-Type:', req.get('content-type') || 'NONE');
    
    const contentType = req.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      console.log('🔍🔍🔍 ✅ THIS IS MULTIPART!');
    }
  }
  next();
});

// Static files - serve uploads from server/uploads
// Use process.cwd() instead of __dirname to work correctly in production
const uploadsPath = path.resolve(process.cwd(), 'uploads');
app.use('/api/uploads', express.static(uploadsPath));
app.use('/uploads', express.static(uploadsPath)); // Also serve directly under /uploads for compatibility
console.log('📁 Serving static files from:', uploadsPath);
console.log('📁 Available at: /api/uploads and /uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('📁 Created uploads directory');
} else {
  console.log('📁 Uploads directory exists');
}

// Health check
app.get('/health', (_req, res) => {
  logger.debug('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error tracking middleware (before error handler)
app.use(errorTrackingMiddleware);

// Error handler
app.use(errorHandler);

export { app };
export default app;
