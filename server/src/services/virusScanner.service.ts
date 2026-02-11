/**
 * Virus Scanner Service
 * ----------------------
 * Optional ClamAV integration for antivirus scanning
 * 
 * Features:
 * - Optional: Won't break if ClamAV not installed
 * - Graceful degradation in dev environments
 * - Production-ready structure
 * - Async scanning
 * 
 * Setup (Production):
 * 1. Install ClamAV: apt-get install clamav clamav-daemon
 * 2. Start daemon: systemctl start clamav-daemon
 * 3. Set ENABLE_VIRUS_SCAN=true in .env
 * 4. Configure CLAMAV_SOCKET or CLAMAV_HOST/PORT
 * 
 * Dev Mode:
 * - If ClamAV not available, scanner returns { isClean: true }
 * - No errors thrown
 * - Logs warning message
 */

import { securityLogger } from '../utils/securityLogger';

// Lazy load ClamAV only if enabled
let NodeClam: any = null;

interface ScanResult {
  isClean: boolean;
  viruses?: string[];
  error?: string;
}

interface VirusScannerConfig {
  enabled: boolean;
  removeInfected: boolean;
  debugMode: boolean;
  clamdscan: {
    socket?: string;
    host?: string;
    port?: number;
    timeout?: number;
    localFallback: boolean;
    path?: string;
  };
  preference: string;
}

class VirusScannerService {
  private config: VirusScannerConfig;
  private scanner: any = null;
  private initialized = false;

  constructor() {
    this.config = {
      enabled: process.env.ENABLE_VIRUS_SCAN === 'true',
      removeInfected: process.env.REMOVE_INFECTED_FILES === 'true',
      debugMode: process.env.NODE_ENV !== 'production',
      clamdscan: {
        socket: process.env.CLAMAV_SOCKET || '/var/run/clamav/clamd.ctl',
        host: process.env.CLAMAV_HOST || '127.0.0.1',
        port: parseInt(process.env.CLAMAV_PORT || '3310', 10),
        timeout: 60000,
        localFallback: true,
        path: '/usr/bin/clamscan',
      },
      preference: 'clamdscan',
    };
  }

  /**
   * Initialize ClamAV scanner (lazy loading)
   */
  private async initialize(): Promise<boolean> {
    if (this.initialized) {
      return !!this.scanner;
    }

    if (!this.config.enabled) {
      if (this.config.debugMode) {
        console.log('ℹ️  [VIRUS_SCAN] Disabled (ENABLE_VIRUS_SCAN=false)');
      }
      this.initialized = true;
      return false;
    }

    try {
      // Lazy load clamscan module
      if (!NodeClam) {
        // @ts-ignore - clamscan doesn't have types, loaded optionally
        NodeClam = await import('clamscan');
      }

      // Initialize scanner
      this.scanner = await new NodeClam.NodeClam().init(this.config);

      console.log('✅ [VIRUS_SCAN] ClamAV initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.warn('⚠️  [VIRUS_SCAN] ClamAV not available:', error instanceof Error ? error.message : 'unknown');
      console.warn('⚠️  [VIRUS_SCAN] Continuing without virus scanning (dev mode)');
      this.initialized = true;
      return false;
    }
  }

  /**
   * Scan a file for viruses
   * 
   * @param filePath - Path to file to scan
   * @param originalName - Original filename (for logging)
   * @returns Scan result
   */
  async scanFile(filePath: string, originalName: string): Promise<ScanResult> {
    // Initialize if needed
    const isAvailable = await this.initialize();

    // If scanner not available or disabled, allow file
    if (!isAvailable || !this.scanner) {
      return { isClean: true };
    }

    try {
      const { isInfected, viruses } = await this.scanner.scanFile(filePath);

      if (isInfected && viruses && viruses.length > 0) {
        // Log virus detection
        securityLogger.logVirusDetected(originalName, viruses.join(', '));

        return {
          isClean: false,
          viruses,
        };
      }

      return { isClean: true };
    } catch (error) {
      // Don't block uploads on scanner errors in dev mode
      if (this.config.debugMode) {
        console.warn('⚠️  [VIRUS_SCAN] Scan error (allowing file):', error);
        return { isClean: true };
      }

      // In production, reject on error
      return {
        isClean: false,
        error: error instanceof Error ? error.message : 'Scan failed',
      };
    }
  }

  /**
   * Scan buffer (in-memory scanning)
   * 
   * @param buffer - File buffer
   * @param originalName - Original filename
   * @returns Scan result
   */
  async scanBuffer(buffer: Buffer, originalName: string): Promise<ScanResult> {
    const isAvailable = await this.initialize();

    if (!isAvailable || !this.scanner) {
      return { isClean: true };
    }

    try {
      const { isInfected, viruses } = await this.scanner.scanBuffer(buffer);

      if (isInfected && viruses && viruses.length > 0) {
        securityLogger.logVirusDetected(originalName, viruses.join(', '));
        return {
          isClean: false,
          viruses,
        };
      }

      return { isClean: true };
    } catch (error) {
      if (this.config.debugMode) {
        console.warn('⚠️  [VIRUS_SCAN] Buffer scan error (allowing):', error);
        return { isClean: true };
      }

      return {
        isClean: false,
        error: error instanceof Error ? error.message : 'Buffer scan failed',
      };
    }
  }

  /**
   * Check if virus scanning is enabled and available
   */
  async isAvailable(): Promise<boolean> {
    const initialized = await this.initialize();
    return initialized && !!this.scanner;
  }

  /**
   * Get scanner status for health checks
   */
  async getStatus(): Promise<{
    enabled: boolean;
    available: boolean;
    version?: string;
  }> {
    const available = await this.isAvailable();
    
    let version: string | undefined;
    if (available && this.scanner) {
      try {
        const versionInfo = await this.scanner.getVersion();
        version = versionInfo;
      } catch {
        version = 'unknown';
      }
    }

    return {
      enabled: this.config.enabled,
      available,
      version,
    };
  }
}

// Export singleton instance
export const virusScannerService = new VirusScannerService();
