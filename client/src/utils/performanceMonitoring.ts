/**
 * Frontend Performance Monitoring
 * Tracks page loads, route changes, and client-side performance
 */

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  pageLoad?: number;
  domContentLoaded?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
  totalBlockingTime?: number;
}

/**
 * Route change metrics
 */
interface RouteChangeMetrics {
  from: string;
  to: string;
  duration: number;
  timestamp: number;
}

/**
 * Performance thresholds (in milliseconds)
 */
const PERFORMANCE_THRESHOLDS = {
  GOOD_PAGE_LOAD: 1000, // < 1s
  ACCEPTABLE_PAGE_LOAD: 2500, // < 2.5s
  GOOD_FCP: 1800, // < 1.8s
  GOOD_LCP: 2500, // < 2.5s
  GOOD_TTI: 3800, // < 3.8s
};

/**
 * Get page load performance metrics
 */
export const getPageLoadMetrics = (): PerformanceMetrics | null => {
  if (!window.performance || !window.performance.timing) {
    return null;
  }

  const timing = window.performance.timing;
  const metrics: PerformanceMetrics = {};

  // Page load time
  if (timing.loadEventEnd > 0) {
    metrics.pageLoad = timing.loadEventEnd - timing.navigationStart;
  }

  // DOM Content Loaded
  if (timing.domContentLoadedEventEnd > 0) {
    metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
  }

  // Get paint metrics if available
  if (window.performance.getEntriesByType) {
    const paintEntries = window.performance.getEntriesByType('paint');
    
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });
  }

  return metrics;
};

/**
 * Get Web Vitals metrics
 */
export const getWebVitals = (): Promise<PerformanceMetrics> => {
  return new Promise((resolve) => {
    const metrics: PerformanceMetrics = {};

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Stop observing after 10 seconds
        setTimeout(() => {
          lcpObserver.disconnect();
          resolve(metrics);
        }, 10000);
      } catch (e) {
        console.warn('LCP observation failed:', e);
        resolve(metrics);
      }
    } else {
      resolve(metrics);
    }
  });
};

/**
 * Log performance metrics
 */
export const logPerformanceMetrics = (metrics: PerformanceMetrics): void => {
  if (!metrics.pageLoad) return;

  const status =
    metrics.pageLoad < PERFORMANCE_THRESHOLDS.GOOD_PAGE_LOAD
      ? '✅ GOOD'
      : metrics.pageLoad < PERFORMANCE_THRESHOLDS.ACCEPTABLE_PAGE_LOAD
      ? '⚠️ ACCEPTABLE'
      : '❌ POOR';

  console.log(`[Performance] Page Load: ${metrics.pageLoad}ms ${status}`, metrics);

  // Send to analytics if configured
  if (window.gtag) {
    window.gtag('event', 'page_performance', {
      page_load: metrics.pageLoad,
      dom_content_loaded: metrics.domContentLoaded,
      first_paint: metrics.firstPaint,
      first_contentful_paint: metrics.firstContentfulPaint,
      largest_contentful_paint: metrics.largestContentfulPaint,
    });
  }
};

/**
 * Track route change performance
 */
export const trackRouteChange = (from: string, to: string, startTime: number): void => {
  const duration = Date.now() - startTime;
  const metric: RouteChangeMetrics = {
    from,
    to,
    duration,
    timestamp: Date.now(),
  };

  const status =
    duration < 100 ? '✅ FAST' : duration < 500 ? '⚠️ NORMAL' : '❌ SLOW';

  console.log(`[Route Change] ${from} → ${to}: ${duration}ms ${status}`);

  // Send to analytics if configured
  if (window.gtag) {
    window.gtag('event', 'route_change', {
      from_path: from,
      to_path: to,
      duration,
    });
  }

  // Store for analysis
  const routeChanges = getStoredRouteChanges();
  routeChanges.push(metric);
  
  // Keep only last 50 route changes
  if (routeChanges.length > 50) {
    routeChanges.shift();
  }
  
  try {
    sessionStorage.setItem('routeChanges', JSON.stringify(routeChanges));
  } catch (e) {
    // Ignore storage errors
  }
};

/**
 * Get stored route changes
 */
const getStoredRouteChanges = (): RouteChangeMetrics[] => {
  try {
    const stored = sessionStorage.getItem('routeChanges');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Get route change statistics
 */
export const getRouteChangeStats = (): {
  count: number;
  avgDuration: number;
  slowRoutes: RouteChangeMetrics[];
} => {
  const routeChanges = getStoredRouteChanges();
  
  if (routeChanges.length === 0) {
    return { count: 0, avgDuration: 0, slowRoutes: [] };
  }

  const totalDuration = routeChanges.reduce((sum, change) => sum + change.duration, 0);
  const avgDuration = totalDuration / routeChanges.length;
  const slowRoutes = routeChanges
    .filter((change) => change.duration > 500)
    .sort((a, b) => b.duration - a.duration);

  return {
    count: routeChanges.length,
    avgDuration: Math.round(avgDuration),
    slowRoutes,
  };
};

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = (): void => {
  // Wait for page load
  if (document.readyState === 'complete') {
    measurePerformance();
  } else {
    window.addEventListener('load', measurePerformance);
  }
};

/**
 * Measure and log performance
 */
const measurePerformance = async (): Promise<void> => {
  // Basic metrics
  const metrics = getPageLoadMetrics();
  if (metrics) {
    logPerformanceMetrics(metrics);
  }

  // Web Vitals
  const webVitals = await getWebVitals();
  if (webVitals.largestContentfulPaint) {
    console.log('[Web Vitals] LCP:', webVitals.largestContentfulPaint, 'ms');
  }
};

/**
 * Create performance monitoring hook for React Router
 */
export const usePerformanceMonitoring = () => {
  let routeStartTime = Date.now();
  let previousPath = window.location.pathname;

  return (currentPath: string) => {
    if (currentPath !== previousPath) {
      trackRouteChange(previousPath, currentPath, routeStartTime);
      previousPath = currentPath;
      routeStartTime = Date.now();
    }
  };
};

// TypeScript declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export type { PerformanceMetrics, RouteChangeMetrics };
