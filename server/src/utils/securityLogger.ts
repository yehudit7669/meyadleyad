/**
 * Security Logger
 * ---------------
 * Logs security-related events for upload operations
 * - File rejections
 * - MIME type mismatches
 * - Magic bytes validation failures
 * - Suspicious file uploads
 */

interface SecurityLogEvent {
  timestamp: Date;
  eventType: 'FILE_REJECTED' | 'MIME_MISMATCH' | 'MAGIC_BYTES_FAILED' | 'ZIP_BOMB_DETECTED' | 'VIRUS_DETECTED';
  originalName: string;
  declaredMimeType: string;
  detectedMimeType?: string;
  detectedExtension?: string;
  reason: string;
  fileSize?: number;
  userId?: string;
  ipAddress?: string;
}

class SecurityLogger {
  /**
   * Log a security event
   */
  log(event: SecurityLogEvent): void {
    const logEntry = {
      timestamp: event.timestamp.toISOString(),
      event: event.eventType,
      file: event.originalName,
      declared: event.declaredMimeType,
      detected: event.detectedMimeType || 'N/A',
      extension: event.detectedExtension || 'N/A',
      reason: event.reason,
      size: event.fileSize ? `${(event.fileSize / 1024).toFixed(2)} KB` : 'N/A',
      user: event.userId || 'anonymous',
      ip: event.ipAddress || 'unknown',
    };

    // Log to console with color coding
    console.warn('🔒 [SECURITY]', JSON.stringify(logEntry, null, 2));

    // TODO: In production, send to logging service (e.g., Winston, Sentry, CloudWatch)
    // this.sendToLoggingService(logEntry);
  }

  /**
   * Log file rejection
   */
  logRejection(
    originalName: string,
    declaredMimeType: string,
    reason: string,
    options?: {
      detectedMimeType?: string;
      detectedExtension?: string;
      fileSize?: number;
      userId?: string;
      ipAddress?: string;
    }
  ): void {
    this.log({
      timestamp: new Date(),
      eventType: 'FILE_REJECTED',
      originalName,
      declaredMimeType,
      reason,
      ...options,
    });
  }

  /**
   * Log MIME type mismatch
   */
  logMimeMismatch(
    originalName: string,
    declaredMimeType: string,
    detectedMimeType: string,
    detectedExtension: string,
    options?: {
      fileSize?: number;
      userId?: string;
      ipAddress?: string;
    }
  ): void {
    this.log({
      timestamp: new Date(),
      eventType: 'MIME_MISMATCH',
      originalName,
      declaredMimeType,
      detectedMimeType,
      detectedExtension,
      reason: `Declared MIME (${declaredMimeType}) does not match detected type (${detectedMimeType})`,
      ...options,
    });
  }

  /**
   * Log ZIP bomb detection
   */
  logZipBomb(
    originalName: string,
    reason: string,
    options?: {
      fileSize?: number;
      userId?: string;
      ipAddress?: string;
    }
  ): void {
    this.log({
      timestamp: new Date(),
      eventType: 'ZIP_BOMB_DETECTED',
      originalName,
      declaredMimeType: 'application/zip',
      reason,
      ...options,
    });
  }

  /**
   * Log virus detection
   */
  logVirusDetected(
    originalName: string,
    virusName: string,
    options?: {
      fileSize?: number;
      userId?: string;
      ipAddress?: string;
    }
  ): void {
    this.log({
      timestamp: new Date(),
      eventType: 'VIRUS_DETECTED',
      originalName,
      declaredMimeType: 'unknown',
      reason: `Virus detected: ${virusName}`,
      ...options,
    });
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();
