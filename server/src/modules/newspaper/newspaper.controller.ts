import { Request, Response, NextFunction } from 'express';
import { newspaperService } from './newspaper.service';
import { AuditService } from '../profile/audit.service';
import { AuthRequest } from '../../middlewares/auth';
import { EmailService } from '../email/email.service';
import path from 'path';
import fs from 'fs/promises';

export class NewspaperController {
  /**
   * GET /api/admin/newspaper
   * Get all newspaper PDFs with pagination
   */
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await newspaperService.getNewspaperAds(page, limit);

      // Prevent caching to ensure fresh data
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/newspaper/generate/:adId
   * Generate newspaper PDF for an ad
   */
  static async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { adId } = req.params;
      const userId = req.user!.id;

      const result = await newspaperService.generateNewspaperPDF(adId, userId);

      res.status(201).json({
        message: 'Newspaper PDF generated successfully',
        data: result.newspaperAd
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/newspaper/regenerate/:newspaperAdId
   * Regenerate newspaper PDF (creates new version)
   */
  static async regenerate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { newspaperAdId } = req.params;
      const userId = req.user!.id;

      const result = await newspaperService.regenerateNewspaperPDF(newspaperAdId, userId);

      res.json({
        message: 'Newspaper PDF regenerated successfully',
        data: result.newspaperAd
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/newspaper/:newspaperAdId/view
   * View newspaper PDF (inline)
   */
  static async view(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newspaperAdId } = req.params;
      const userId = req.user!.id;

      const newspaperAd = await newspaperService.getNewspaperPDFById(newspaperAdId);

      if (!newspaperAd) {
        res.status(404).json({ error: 'Newspaper PDF not found' });
        return;
      }

      if (!newspaperAd.pdfPath) {
        res.status(404).json({ error: 'PDF file not generated yet' });
        return;
      }

      // Log view action
      await AuditService.log(userId, 'NEWSPAPER_SHEET_PDF_VIEWED', {
        sheetId: newspaperAdId,
        title: newspaperAd.title
      });

      // Serve PDF
      const filePath = path.join(process.cwd(), newspaperAd.pdfPath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/newspaper/:newspaperAdId/download
   * Download newspaper PDF (requires EXPORT permission)
   */
  static async download(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newspaperAdId } = req.params;
      const userId = req.user!.id;

      // Route is already protected by authorize('ADMIN') middleware
      const newspaperAd = await newspaperService.getNewspaperPDFById(newspaperAdId);

      if (!newspaperAd) {
        res.status(404).json({ error: 'Newspaper PDF not found' });
        return;
      }

      if (!newspaperAd.pdfPath) {
        res.status(404).json({ error: 'PDF file not generated yet' });
        return;
      }

      // Log download action
      await AuditService.log(userId, 'NEWSPAPER_SHEET_PDF_DOWNLOADED', {
        sheetId: newspaperAdId,
        title: newspaperAd.title
      });

      // Serve PDF
      const filePath = path.join(process.cwd(), newspaperAd.pdfPath);
      const filename = path.basename(filePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/newspaper/:newspaperAdId/distribute
   * Distribute newspaper PDF to mailing list
   */
  static async distribute(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newspaperAdId } = req.params;
      const { emailList } = req.body;
      const userId = req.user!.id;

      if (!emailList || !Array.isArray(emailList) || emailList.length === 0) {
        res.status(400).json({ error: 'Email list is required' });
        return;
      }

      const newspaperAd = await newspaperService.getNewspaperPDFById(newspaperAdId);

      if (!newspaperAd) {
        res.status(404).json({ error: 'Newspaper PDF not found' });
        return;
      }

      // Send email to each recipient with PDF attachment
      const emailService = new EmailService();
      const filePath = path.join(process.cwd(), newspaperAd.filePath);
      const pdfBuffer = await fs.readFile(filePath);
      const filename = path.basename(filePath);

      let successCount = 0;
      let failedEmails: string[] = [];

      for (const email of emailList) {
        try {
          await emailService.sendEmail(
            email,
            `מודעה בתצורת עיתון - ${newspaperAd.ad.title}`,
            `
              <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
                <h2>שלום,</h2>
                <p>מצורף מודעה בתצורת עיתון מ-מיעדליעד:</p>
                <p><strong>${newspaperAd.ad.title}</strong></p>
                <p>${newspaperAd.ad.address || ''}</p>
                <p>הקובץ מצורף כ-PDF.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">מערכת מיעדליעד - מודעות מסווגות</p>
              </div>
            `,
            [{
              filename,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }]
          );
          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
          failedEmails.push(email);
        }
      }

      // Log distribution action
      await AuditService.log(userId, 'NEWSPAPER_PDF_DISTRIBUTED', {
        newspaperAdId,
        adId: newspaperAd.adId,
        recipientCount: emailList.length,
        successCount,
        failedCount: failedEmails.length
      });

      res.json({
        message: `PDF נשלח בהצלחה ל-${successCount} מתוך ${emailList.length} נמענים`,
        success: true,
        successCount,
        failedCount: failedEmails.length,
        failedEmails: failedEmails.length > 0 ? failedEmails : undefined
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/newspaper/:newspaperAdId
   * Delete newspaper PDF
   */
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { newspaperAdId } = req.params;
      const userId = req.user!.id;

      await newspaperService.deleteNewspaperPDF(newspaperAdId, userId);

      res.json({
        message: 'Newspaper PDF deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/newspaper/versions/:adId
   * Get all versions of newspaper PDF for an ad
   */
  static async getVersions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { adId } = req.params;

      const versions = await newspaperService.getNewspaperPDFVersions(adId);

      res.json({
        data: versions
      });
    } catch (error) {
      next(error);
    }
  }
}
