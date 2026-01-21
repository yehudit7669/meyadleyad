/**
 * Puppeteer Configuration Utility
 * מנהל את התצורה של Puppeteer לסביבות שונות (Local vs Production)
 */

import type { LaunchOptions } from 'puppeteer-core';

interface BrowserConfig {
  executablePath?: string;
  args: string[];
  headless: boolean | 'new';
}

/**
 * Get Puppeteer browser configuration based on environment
 */
export async function getPuppeteerConfig(): Promise<LaunchOptions> {
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = !!process.env.RENDER; // Render.com sets this env var

  console.log('🔧 Puppeteer Config:', { isProduction, isRender, NODE_ENV: process.env.NODE_ENV });

  if (isProduction || isRender) {
    // Production: Use @sparticuz/chromium
    try {
      // Dynamic import for production only
      const chromium = await import('@sparticuz/chromium');
      
      const executablePath = await chromium.default.executablePath();
      console.log('✅ Using @sparticuz/chromium with path:', executablePath);

      return {
        executablePath,
        args: chromium.default.args,
        headless: true, // Always headless in production
        // Additional args for stability
        defaultViewport: {
          width: 1200,
          height: 1600,
        },
      };
    } catch (error) {
      console.error('❌ Failed to load @sparticuz/chromium:', error);
      console.log('⚠️  Falling back to puppeteer default');
      // Fallback to standard puppeteer if sparticuz fails
      return {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      };
    }
  } else {
    // Development: Use regular puppeteer (installed locally)
    console.log('✅ Using local Puppeteer (development mode)');
    
    return {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
      defaultViewport: {
        width: 1200,
        height: 1600,
      },
    };
  }
}

/**
 * Get page wait options for PDF generation
 */
export function getPDFWaitOptions() {
  return {
    waitUntil: ['load', 'domcontentloaded', 'networkidle2'] as Array<'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'>,
    timeout: 60000, // 60 seconds
  };
}

/**
 * Get PDF generation options
 */
export function getPDFOptions() {
  return {
    format: 'A4' as const,
    printBackground: true,
    margin: {
      top: '15mm',
      right: '12mm',
      bottom: '15mm',
      left: '12mm',
    },
    timeout: 60000, // 60 seconds
  };
}

/**
 * Wrapper for launching browser with proper error handling
 */
export async function launchBrowser() {
  try {
    // Import puppeteer-core
    const puppeteer = await import('puppeteer-core');
    const config = await getPuppeteerConfig();
    
    console.log('🚀 Launching browser with config:', JSON.stringify(config, null, 2));
    const browser = await puppeteer.launch(config);
    console.log('✅ Browser launched successfully');
    
    return browser;
  } catch (error) {
    console.error('❌ Failed to launch browser:', error);
    throw new Error(`Browser launch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
