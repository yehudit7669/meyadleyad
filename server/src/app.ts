import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/sanitizeLogger';
import { performanceMonitor } from './middlewares/performanceMonitor';
import { initErrorTracking, errorTrackingMiddleware } from './utils/errorTracking';
import { logger } from './utils/logger';

const app: Application = express();

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
  config.frontendUrl,
  'http://localhost:3000', // Development
  'http://localhost:3001', // Vite dev server (alternative port)
  'http://localhost:5173', // Vite dev server
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list OR is a Vercel preview URL
      const isAllowed = allowedOrigins.includes(origin) || 
                       (origin && origin.includes('.vercel.app'));
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn('⚠️  CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'], // For pagination
    maxAge: 600, // 10 minutes
  })
);

// Rate limiting - Different limits for different routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'יותר מדי ניסיונות התחברות, אנא נסה שוב מאוחר יותר.',
  skipSuccessfulRequests: true, // Don't count successful requests
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

// Static files - serve uploads from server/uploads
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath, {
  maxAge: '1d', // Cache for 1 day
  setHeaders: (res, filePath) => {
    // Set proper content type
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    
    // Allow CORS for images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
console.log('📁 Serving static files from:', uploadsPath);

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
