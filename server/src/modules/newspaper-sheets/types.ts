/**
 * Types and interfaces for Newspaper Sheet System
 * מערכת גיליונות עיתון - קטגוריה + עיר
 */

import { NewspaperSheetStatus } from '@prisma/client';

/**
 * Layout Configuration
 * הגדרות סידור כרטיסי הנכסים בגריד
 */
export interface LayoutConfig {
  gridColumns: number;  // מספר עמודות בגריד
  cardPositions: CardPosition[];  // מיקומים של הכרטיסים
}

export interface CardPosition {
  listingId: string;   // מזהה המודעה
  position: number;    // מיקום בגריד (0-based)
  customSize?: 'normal' | 'double';  // גודל מותאם (אופציונלי)
}

/**
 * Sheet Creation Data
 */
export interface CreateSheetData {
  categoryId: string;
  cityId: string;
  title: string;
  headerImage?: string;
  layoutConfig?: LayoutConfig;
}

/**
 * Sheet Update Data
 */
export interface UpdateSheetData {
  title?: string;
  headerImage?: string;
  layoutConfig?: LayoutConfig;
  status?: NewspaperSheetStatus;
  issueNumber?: string;
  issueDate?: string;
}

/**
 * Add Listing to Sheet
 */
export interface AddListingData {
  listingId: string;
  positionIndex?: number;
}

/**
 * Sheet with Full Details
 */
export interface SheetWithListings {
  id: string;
  categoryId: string;
  cityId: string;
  title: string;
  headerImage: string | null;
  layoutConfig: LayoutConfig | null;
  version: number;
  pdfPath: string | null;
  status: NewspaperSheetStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    nameHe: string;
  };
  city: {
    id: string;
    nameHe: string;
  };
  creator: {
    name: string | null;
    email: string;
  };
  listings: Array<{
    id: string;
    listingId: string;
    positionIndex: number;
    addedAt: Date;
    listing: {
      id: string;
      title: string;
      address: string | null;
      price: number | null;
      customFields: any;
      User?: {
        name: string | null;
        email: string;
        phone: string | null;
      };
      AdImage: Array<{
        url: string;
        order: number;
      }>;
    };
  }>;
  ads?: Array<{
    id: string;
    imageUrl: string;
    size: string;
    anchorType: string;
    beforeListingId: string | null;
    page: number | null;
    row: number | null;
    col: number | null;
  }>;
  _count: {
    listings: number;
  };
}

/**
 * PDF Generation Options
 */
export interface PDFGenerationOptions {
  sheetId: string;
  force?: boolean;  // כפה יצירה חדשה גם אם קיים PDF
}

/**
 * Sheet List Query
 */
export interface SheetListQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  cityId?: string;
  status?: NewspaperSheetStatus;
}

/**
 * General Sheet Options
 * אפשרויות ליצירת לוח מודעות כללי
 */
export interface GeneralSheetOptions {
  force?: boolean;  // כפה יצירה חדשה גם אם קיים PDF
  orderBy?: 'city' | 'category';  // סדר הדפים: לפי עיר או קטגוריה
}

/**
 * Combined Sheet for General Newspaper
 * גיליון משולב ללוח המודעות הכללי
 */
export interface CombinedSheetData {
  cityName: string;
  categoryName: string;
  sheets: SheetWithListings[];
}
