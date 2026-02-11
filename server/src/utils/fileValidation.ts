/**
 * File Validation Utilities
 * --------------------------
 * Defense-in-depth file validation using magic bytes (file signatures)
 * 
 * Security Layers:
 * 1. MIME type check (existing Multer)
 * 2. File extension check (existing Multer)
 * 3. Magic bytes validation (NEW - this file)
 * 4. Safe parsing (Sharp/XLSX - existing)
 * 
 * Prevents:
 * - MIME type spoofing
 * - Extension spoofing
 * - Malicious file uploads
 * - ZIP bombs
 */

import * as fs from 'fs/promises';
import { securityLogger } from './securityLogger';
import * as unzipper from 'unzipper';

// file-type@16.5.4 supports CommonJS
const { fileTypeFromBuffer } = require('file-type');

/**
 * Allowed file types with their real MIME types
 */
export const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  
  // Documents
  'application/pdf': ['.pdf'],
  
  // Spreadsheets
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  
  // Archives (with strict validation)
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
} as const;

/**
 * Magic bytes validation result
 */
interface MagicBytesResult {
  isValid: boolean;
  detectedMimeType?: string;
  detectedExtension?: string;
  reason?: string;
}

/**
 * Validate file using magic bytes (file signature)
 * 
 * @param filePath - Path to uploaded file
 * @param declaredMimeType - MIME type from multer/request
 * @param allowedMimeTypes - Array of allowed MIME types
 * @returns Validation result
 */
export async function validateMagicBytes(
  filePath: string,
  declaredMimeType: string,
  allowedMimeTypes: string[]
): Promise<MagicBytesResult> {
  try {
    // Read first 4100 bytes (enough for file-type detection)
    const buffer = await fs.readFile(filePath);
    const fileType = await fileTypeFromBuffer(buffer);

    // Handle CSV files (no magic bytes, check manually)
    if (declaredMimeType === 'text/csv' && allowedMimeTypes.includes('text/csv')) {
      // CSV has no magic bytes - validate first line structure
      const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
      if (content.includes(',') || content.includes('\t')) {
        return { isValid: true };
      }
      return {
        isValid: false,
        reason: 'File does not appear to be a valid CSV',
      };
    }

    // File type could not be detected
    if (!fileType) {
      return {
        isValid: false,
        reason: 'Unable to detect file type from magic bytes',
      };
    }

    const detectedMime = fileType.mime;
    const detectedExt = fileType.ext;

    // Check if detected MIME type is allowed
    if (!allowedMimeTypes.includes(detectedMime)) {
      return {
        isValid: false,
        detectedMimeType: detectedMime,
        detectedExtension: detectedExt,
        reason: `Detected file type (${detectedMime}) is not allowed`,
      };
    }

    // Check if detected MIME matches declared MIME
    // Allow some flexibility for JPEG (image/jpg vs image/jpeg)
    const normalizedDeclared = declaredMimeType === 'image/jpg' ? 'image/jpeg' : declaredMimeType;
    const normalizedDetected = (detectedMime as string) === 'image/jpg' ? 'image/jpeg' : detectedMime;

    if (normalizedDeclared !== normalizedDetected) {
      return {
        isValid: false,
        detectedMimeType: detectedMime,
        detectedExtension: detectedExt,
        reason: `MIME type mismatch: declared ${declaredMimeType}, detected ${detectedMime}`,
      };
    }

    return {
      isValid: true,
      detectedMimeType: detectedMime,
      detectedExtension: detectedExt,
    };
  } catch (error) {
    return {
      isValid: false,
      reason: `Magic bytes validation error: ${error instanceof Error ? error.message : 'unknown'}`,
    };
  }
}

/**
 * Validate ZIP file for potential ZIP bomb
 * 
 * Protection against:
 * - Extremely large uncompressed size
 * - Too many files
 * - Excessive compression ratio
 * 
 * @param filePath - Path to ZIP file
 * @param maxUncompressedSize - Max total uncompressed size (default: 100MB)
 * @param maxFileCount - Max number of files in ZIP (default: 1000)
 * @returns Validation result
 */
export async function validateZipFile(
  filePath: string,
  maxUncompressedSize: number = 100 * 1024 * 1024, // 100MB
  maxFileCount: number = 1000
): Promise<{ isValid: boolean; reason?: string }> {
  try {
    const stats = await fs.stat(filePath);
    const compressedSize = stats.size;

    // Quick check: if compressed file is already too large, reject
    if (compressedSize > maxUncompressedSize) {
      return {
        isValid: false,
        reason: `ZIP file too large: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    // Parse ZIP file entries (without extracting)
    const directory = await unzipper.Open.file(filePath);
    const files = directory.files;

    // Check file count
    if (files.length > maxFileCount) {
      return {
        isValid: false,
        reason: `ZIP contains too many files: ${files.length} (max: ${maxFileCount})`,
      };
    }

    // Calculate total uncompressed size
    let totalUncompressedSize = 0;
    for (const file of files) {
      totalUncompressedSize += file.uncompressedSize;
    }

    // Check uncompressed size
    if (totalUncompressedSize > maxUncompressedSize) {
      return {
        isValid: false,
        reason: `ZIP uncompressed size too large: ${(totalUncompressedSize / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    // Check compression ratio (potential bomb)
    const compressionRatio = totalUncompressedSize / compressedSize;
    const MAX_COMPRESSION_RATIO = 100; // Suspicious if > 100:1

    if (compressionRatio > MAX_COMPRESSION_RATIO) {
      return {
        isValid: false,
        reason: `Suspicious compression ratio: ${compressionRatio.toFixed(2)}:1 (potential ZIP bomb)`,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      reason: `ZIP validation error: ${error instanceof Error ? error.message : 'unknown'}`,
    };
  }
}

/**
 * Comprehensive file validation
 * Combines all security checks
 * 
 * @param filePath - Path to uploaded file
 * @param declaredMimeType - MIME type from request
 * @param allowedMimeTypes - Allowed MIME types
 * @param originalName - Original filename
 * @returns Validation result with detailed reason if invalid
 */
export async function validateUploadedFile(
  filePath: string,
  declaredMimeType: string,
  allowedMimeTypes: string[],
  originalName: string
): Promise<{ isValid: boolean; reason?: string }> {
  // Step 1: Magic bytes validation
  const magicBytesResult = await validateMagicBytes(
    filePath,
    declaredMimeType,
    allowedMimeTypes
  );

  if (!magicBytesResult.isValid) {
    // Log MIME mismatch if detected
    if (magicBytesResult.detectedMimeType) {
      securityLogger.logMimeMismatch(
        originalName,
        declaredMimeType,
        magicBytesResult.detectedMimeType,
        magicBytesResult.detectedExtension || 'unknown'
      );
    } else {
      securityLogger.logRejection(
        originalName,
        declaredMimeType,
        magicBytesResult.reason || 'Magic bytes validation failed'
      );
    }

    return {
      isValid: false,
      reason: magicBytesResult.reason || 'File validation failed',
    };
  }

  // Step 2: ZIP bomb validation (if ZIP file)
  if (declaredMimeType === 'application/zip' || declaredMimeType === 'application/x-zip-compressed') {
    const zipResult = await validateZipFile(filePath);
    if (!zipResult.isValid) {
      securityLogger.logZipBomb(originalName, zipResult.reason || 'ZIP validation failed');
      return {
        isValid: false,
        reason: zipResult.reason || 'Unsafe ZIP file',
      };
    }
  }

  return { isValid: true };
}
