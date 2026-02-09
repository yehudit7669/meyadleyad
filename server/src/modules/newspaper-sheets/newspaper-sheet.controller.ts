import { Request, Response } from 'express';
import { newspaperSheetService } from './newspaper-sheet.service';
import { NewspaperSheetStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { AuditService } from '../profile/audit.service';
import path from 'path';
import fs from 'fs/promises';

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

  /**
   * POST /api/admin/newspaper-sheets/general/generate-pdf
   * יצירת PDF כללי של כל הנכסים
   */
  async generateGeneralSheetPDF(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const { force = false, orderBy = 'city' } = req.body;

      console.log('📰 Controller: Generating general sheet PDF...');

      const result = await newspaperSheetService.generateGeneralSheetPDF(userId, {
        force,
        orderBy
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error generating general sheet PDF:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/newspaper-sheets/general/view
   * צפייה בלוח כללי (inline)
   */
  async viewGeneralSheetPDF(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const orderBy = (req.query.orderBy as string) || 'city';

      console.log('📰 Controller: Viewing general sheet PDF...');

      // Generate fresh PDF
      const result = await newspaperSheetService.generateGeneralSheetPDF(userId, {
        force: false,
        orderBy: orderBy as 'city' | 'category'
      });

      // Serve PDF inline
      const filePath = path.join(process.cwd(), result.pdfPath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
    } catch (error: any) {
      console.error('Error viewing general sheet PDF:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/newspaper-sheets/general/download
   * הורדת לוח כללי
   */
  async downloadGeneralSheetPDF(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const orderBy = (req.query.orderBy as string) || 'city';

      console.log('📰 Controller: Downloading general sheet PDF...');

      // Generate fresh PDF
      const result = await newspaperSheetService.generateGeneralSheetPDF(userId, {
        force: false,
        orderBy: orderBy as 'city' | 'category'
      });

      // Serve PDF as download
      const filePath = path.join(process.cwd(), result.pdfPath);
      const filename = path.basename(filePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
    } catch (error: any) {
      console.error('Error downloading general sheet PDF:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/newspaper-sheets/general/distribute
   * הפצת לוח כללי לרשימת תפוצה
   */
  async distributeGeneralSheetPDF(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id || '';
      const { emailList, orderBy = 'city' } = req.body;

      if (!emailList || !Array.isArray(emailList) || emailList.length === 0) {
        res.status(400).json({ error: 'Email list is required' });
        return;
      }

      console.log('📰 Controller: Distributing general sheet PDF...');

      // Generate fresh PDF
      const result = await newspaperSheetService.generateGeneralSheetPDF(userId, {
        force: false,
        orderBy: orderBy as 'city' | 'category'
      });

      // Send email to each recipient
      const emailService = new EmailService();
      const filePath = path.join(process.cwd(), result.pdfPath);
      const pdfBuffer = await fs.readFile(filePath);
      const filename = path.basename(filePath);

      let successCount = 0;
      let failedEmails: string[] = [];

      for (const email of emailList) {
        try {
          await emailService.sendEmail(
            email,
            'לוח מודעות כללי - מקומי',
            `
              <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
                <h2>שלום,</h2>
                <p>מצורף לוח מודעות כללי ממערכת מקומי</p>
                <p>הלוח כולל את כל המודעות הפעילות מכל הערים והקטגוריות.</p>
                <p>הקובץ מצורף כ-PDF.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">מערכת מקומי - מודעות מסווגות</p>
              </div>
            `,
            [
              {
                filename,
                content: pdfBuffer
              }
            ]
          );
          successCount++;
        } catch (emailError) {
          console.error(`Failed to send to ${email}:`, emailError);
          failedEmails.push(email);
        }
      }

      // Log distribution
      await AuditService.log(userId, 'GENERAL_SHEET_DISTRIBUTED', {
        sheetsCount: result.sheetsCount,
        emailsSent: successCount,
        emailsFailed: failedEmails.length,
        failedEmails
      });

      // Increment global issue number after successful distribution
      // העלאת מספר הגליון הגלובלי לאחר הפצה מוצלחת
      if (successCount > 0) {
        await newspaperSheetService.incrementGlobalIssueNumber();
        console.log(`✅ Global issue number incremented after successful distribution`);
      }

      res.json({
        success: true,
        message: `General sheet distributed to ${successCount} recipients`,
        successCount,
        failedCount: failedEmails.length,
        failedEmails
      });
    } catch (error: any) {
      console.error('Error distributing general sheet PDF:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/newspaper-sheets/:id/ads
   * הוספת פרסומת לגיליון
   */
  async addAdvertisement(req: AuthRequest, res: Response) {
    try {
      const { id: sheetId } = req.params;
      const { imageUrl, size, anchorType, beforeListingId, page, row, col } = req.body;
      const userId = req.user?.id || '';

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const ad = await newspaperSheetService.addAdvertisement(
        sheetId,
        {
          imageUrl,
          size,
          anchorType,
          beforeListingId,
          page,
          row,
          col
        },
        userId
      );

      res.json(ad);
    } catch (error: any) {
      console.error('Error adding advertisement:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT/PATCH /api/admin/newspaper-sheets/:id/ads/:adId
   * עדכון פרסומת
   */
  async updateAdvertisement(req: AuthRequest, res: Response) {
    try {
      const { id: sheetId, adId } = req.params;
      const { imageUrl, size, anchorType, beforeListingId, page, row, col } = req.body;
      const userId = req.user?.id || '';

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const ad = await newspaperSheetService.updateAdvertisement(
        adId,
        {
          imageUrl,
          size,
          anchorType,
          beforeListingId,
          page,
          row,
          col
        },
        userId
      );

      res.json(ad);
    } catch (error: any) {
      console.error('Error updating advertisement:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/admin/newspaper-sheets/:id/ads/:adId
   * הסרת פרסומת מגיליון
   */
  async removeAdvertisement(req: AuthRequest, res: Response) {
    try {
      const { id: sheetId, adId } = req.params;
      const userId = req.user?.id || '';

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      await newspaperSheetService.removeAdvertisement(sheetId, adId, userId);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error removing advertisement:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/newspaper-sheets/:id/calculate-layout
   * חישוב layout עם פרסומות לתצוגה מקדימה
   */
  async calculateLayout(req: AuthRequest, res: Response) {
    try {
      const { id: sheetId } = req.params;

      const layout = await newspaperSheetService.calculateSheetLayout(sheetId);

      res.json(layout);
    } catch (error: any) {
      console.error('Error calculating layout:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const newspaperSheetController = new NewspaperSheetController();
