import { Request, Response } from 'express';
import { newspaperSheetService } from './newspaper-sheet.service';
import { NewspaperSheetStatus } from '@prisma/client';

// הרחבת Request עם user
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * Controller for Newspaper Sheets Management
 * ניהול גיליונות עיתון
 */
export class NewspaperSheetController {
  /**
   * GET /api/admin/newspaper-sheets
   * רשימת כל הגיליונות
   */
  async listSheets(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const categoryId = req.query.categoryId as string;
      const cityId = req.query.cityId as string;
      const status = req.query.status as NewspaperSheetStatus;

      const result = await newspaperSheetService.listSheets({
        page,
        limit,
        categoryId,
        cityId,
        status
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error listing sheets:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/newspaper-sheets/:id
   * קבלת גיליון בודד עם כל הפרטים
   */
  async getSheet(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const sheet = await newspaperSheetService.getSheetById(id);
      res.json(sheet);
    } catch (error: any) {
      console.error('Error getting sheet:', error);
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/newspaper-sheets/:id/add-listing
   * הוספת מודעה לגיליון
   */
  async addListing(req: AuthRequest, res: Response) {
    try {
      const { id: sheetId } = req.params;
      const { listingId, positionIndex } = req.body;
      const userId = req.user?.id || '';

      const result = await newspaperSheetService.addListingToSheet(
        sheetId,
        listingId,
        userId,
        positionIndex
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error adding listing to sheet:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/admin/newspaper-sheets/:id/listings/:listingId
   * הסרת מודעה מגיליון
   */
  async removeListing(req: AuthRequest, res: Response) {
    try {
      const { id: sheetId, listingId } = req.params;
      const userId = req.user?.id || '';

      await newspaperSheetService.removeListingFromSheet(
        sheetId,
        listingId,
        userId
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error removing listing from sheet:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/admin/newspaper-sheets/:id/listings/:listingId/position
   * עדכון מיקום מודעה (Drag & Drop)
   */
  async updateListingPosition(req: AuthRequest, res: Response) {
    try {
      const { id: sheetId, listingId } = req.params;
      const { newPosition } = req.body;
      
      if (!req.user?.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const userId = req.user.id;

      await newspaperSheetService.updateListingPosition(
        sheetId,
        listingId,
        newPosition,
        userId
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating listing position:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/admin/newspaper-sheets/:id
   * עדכון פרטי גיליון (כותרת, תמונה, וכו')
   */
  async updateSheet(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '';

      const sheet = await newspaperSheetService.updateSheet(
        id,
        req.body,
        userId
      );

      res.json(sheet);
    } catch (error: any) {
      console.error('Error updating sheet:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/newspaper-sheets/:id/generate-pdf
   * יצירת PDF לגיליון
   */
  async generatePDF(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '';
      const force = req.body.force || false;

      const result = await newspaperSheetService.generateSheetPDF(
        id,
        userId,
        force
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/admin/newspaper-sheets/:id
   * מחיקת גיליון
   */
  async deleteSheet(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '';

      await newspaperSheetService.deleteSheet(id, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting sheet:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/newspaper-sheets/category/:categoryId/city/:cityId
   * קבלת או יצירת גיליון לקטגוריה+עיר
   */
  async getOrCreateSheet(req: AuthRequest, res: Response) {
    try {
      const { categoryId, cityId } = req.params;
      const userId = req.user?.id || '';

      const sheet = await newspaperSheetService.getOrCreateActiveSheet(
        categoryId,
        cityId,
        userId
      );

      res.json(sheet);
    } catch (error: any) {
      console.error('Error getting/creating sheet:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const newspaperSheetController = new NewspaperSheetController();
