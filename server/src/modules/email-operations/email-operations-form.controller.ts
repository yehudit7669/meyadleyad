/**
 * Email Operations Form Submission Controller
 * טיפול בטפסים שנשלחו דרך Google Forms או טפסים מותאמים אישית
 * 
 * מקבל נתוני טופס ויוצר מודעה/בקשה בסטטוס PENDING
 * לאחר אישור המנהל - נשלח מייל אישור פרסום
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { emailOperationsTemplates } from './email-operations-templates.service';
import { emailAuditLogger } from './email-audit-logger.service';
import { EmailCommandType } from './email-command-parser.service';
import { emailOperationsOrchestrator } from './email-operations-orchestrator.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface FormSubmissionData {
  // זיהוי
  senderEmail: string;
  userName?: string;
  userPhone?: string;

  // סוג הפעולה
  formType: 'publish' | 'wanted';
  category: string; // "דירות למכירה", "דירות להשכרה", וכו'

  // פרטי המודעה/בקשה
  title: string;
  description: string;
  price?: number;
  
  // מיקום
  cityId?: string;
  cityName?: string;
  address?: string;
  streetId?: string;
  neighborhood?: string;

  // שדות מותאמים אישית
  customFields?: Record<string, any>;

  // עבור "דרוש"
  isWanted?: boolean;
  requestedLocationText?: string;
}

export class EmailOperationsFormController {
  /**
   * קבלת טופס פרסום מודעה
   * POST /api/email-operations/forms/submit
   */
  async handleFormSubmission(req: Request, res: Response) {
    try {
      const formData: FormSubmissionData = req.body;

      // ולידציה בסיסית
      if (!formData.senderEmail || !formData.title || !formData.category) {
        res.status(400).json({ 
          error: 'Missing required fields: senderEmail, title, category' 
        });
        return;
      }

      // בדיקה אם המשתמש קיים
      const user = await prisma.user.findUnique({
        where: { email: formData.senderEmail.toLowerCase().trim() },
      });

      if (!user) {
        res.status(403).json({ 
          error: 'User not registered. Please complete registration first.' 
        });
        return;
      }

      // מציאת הקטגוריה
      const category = await prisma.category.findFirst({
        where: {
          OR: [
            { nameHe: formData.category },
            { name: formData.category },
          ],
        },
      });

      if (!category) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }

      // יצירת המודעה בסטטוס PENDING
      const ad = await prisma.ad.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          categoryId: category.id,
          cityId: formData.cityId,
          streetId: formData.streetId,
          title: formData.title,
          description: formData.description,
          price: formData.price,
          address: formData.address,
          customFields: formData.customFields || {},
          status: 'PENDING',
          isWanted: formData.isWanted || false,
          requestedLocationText: formData.requestedLocationText,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Created ad ${ad.adNumber} in PENDING status`);

      // תיעוד
      await emailAuditLogger.logSuccess({
        email: formData.senderEmail,
        action: 'FORM_SUBMITTED',
        commandType: formData.isWanted 
          ? EmailCommandType.WANTED_BUY 
          : EmailCommandType.PUBLISH_SALE,
        adId: ad.adNumber.toString(),
        userId: user.id,
        metadata: {
          formType: formData.formType,
          category: formData.category,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Ad created successfully and pending approval',
        adId: ad.id,
        adNumber: ad.adNumber,
      });

      // הערה: מייל אישור פרסום יישלח רק לאחר שהמנהל יאשר את המודעה
      // זה יקרה ב-webhook/callback שמופעל כשהמנהל משנה את הסטטוס ל-APPROVED
    } catch (error) {
      console.error('❌ Error handling form submission:', error);
      res.status(500).json({ 
        error: 'Failed to process form submission',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Webhook/Callback שנקרא כאשר מנהל מאשר מודעה
   * נקודת קריאה פנימית או webhook מהמערכת
   * 
   * זה יכול להיקרא ידנית או אוטומטית כשמנהל משנה סטטוס מודעה ל-APPROVED
   */
  async handleAdApproved(adId: string, adNumber: number) {
    try {
      const ad = await prisma.ad.findUnique({
        where: { id: adId },
        include: {
          User: {
            select: {
              email: true,
              name: true,
            },
          },
          Category: {
            select: {
              nameHe: true,
            },
          },
        },
      });

      if (!ad || !ad.User) {
        console.error(`Ad ${adId} or user not found`);
        return;
      }

      // שליחת מייל אישור פרסום
      if (ad.isWanted) {
        await emailOperationsTemplates.sendRequestPublishedConfirmationEmail(
          ad.User.email,
          adNumber.toString(),
          ad.title
        );
      } else {
        await emailOperationsTemplates.sendAdPublishedConfirmationEmail(
          ad.User.email,
          adNumber.toString(),
          ad.title
        );
      }

      await emailAuditLogger.logSuccess({
        email: ad.User.email,
        action: 'AD_APPROVED_EMAIL_SENT',
        commandType: ad.isWanted 
          ? EmailCommandType.WANTED_BUY 
          : EmailCommandType.PUBLISH_SALE,
        adId: adNumber.toString(),
        userId: ad.userId,
      });

      console.log(`✅ Sent approval email for ad ${adNumber} to ${ad.User.email}`);
    } catch (error) {
      console.error('❌ Error in handleAdApproved:', error);
    }
  }

  /**
   * טיפול בהשלמת הרשמה - עיבוד Pending Intents
   * POST /api/email-operations/registration-completed
   */
  async handleRegistrationCompleted(req: Request, res: Response) {
    try {
      const { email, userId } = req.body;

      if (!email || !userId) {
        res.status(400).json({ error: 'Missing email or userId' });
        return;
      }

      // שליחת מייל "ההרשמה הושלמה"
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      await emailOperationsTemplates.sendRegistrationCompletedEmail(
        email,
        user?.name || undefined
      );

      // עיבוד Pending Intents
      await emailOperationsOrchestrator.processPendingIntentsForUser(email, userId);

      res.status(200).json({ 
        success: true,
        message: 'Registration completed and pending intents processed'
      });
    } catch (error) {
      console.error('❌ Error in registration completed:', error);
      res.status(500).json({ error: 'Failed to process registration completion' });
    }
  }

  /**
   * קבלת URL לטופס לפי קטגוריה
   * GET /api/email-operations/forms/url/:category
   */
  async getFormUrl(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const formUrls: Record<string, string> = {
        'publish-sale': `${baseUrl}/forms/publish-sale`,
        'publish-rent': `${baseUrl}/forms/publish-rent`,
        'publish-shabbat': `${baseUrl}/forms/publish-shabbat`,
        'publish-commercial': `${baseUrl}/forms/publish-commercial`,
        'publish-shared-ownership': `${baseUrl}/forms/publish-shared-ownership`,
        'wanted-buy': `${baseUrl}/forms/wanted-buy`,
        'wanted-rent': `${baseUrl}/forms/wanted-rent`,
        'wanted-shabbat': `${baseUrl}/forms/wanted-shabbat`,
      };

      const url = formUrls[category] || `${baseUrl}/forms/general`;

      res.status(200).json({ url });
    } catch (error) {
      console.error('❌ Error getting form URL:', error);
      res.status(500).json({ error: 'Failed to get form URL' });
    }
  }

  /**
   * אינטגרציה עם Google Forms - Apps Script Webhook
   * POST /api/email-operations/forms/google-forms-webhook
   * 
   * קוד Apps Script ב-Google Forms ישלח POST לכאן עם הנתונים
   */
  async handleGoogleFormsWebhook(req: Request, res: Response) {
    try {
      // נתונים מ-Google Forms יגיעו בפורמט שונה
      // צריך לנרמל אותם לפורמט שלנו
      const rawData = req.body;

      const formData: FormSubmissionData = {
        senderEmail: rawData.email || rawData['כתובת אימייל'],
        userName: rawData.name || rawData['שם מלא'],
        userPhone: rawData.phone || rawData['טלפון'],
        formType: rawData.formType || 'publish',
        category: rawData.category || rawData['קטגוריה'],
        title: rawData.title || rawData['כותרת'],
        description: rawData.description || rawData['תיאור'],
        price: rawData.price ? parseFloat(rawData.price) : undefined,
        cityName: rawData.city || rawData['עיר'],
        address: rawData.address || rawData['כתובת'],
        customFields: rawData.customFields || {},
      };

      // קריאה לטיפול הרגיל
      req.body = formData;
      await this.handleFormSubmission(req, res);
    } catch (error) {
      console.error('❌ Error in Google Forms webhook:', error);
      res.status(500).json({ error: 'Failed to process Google Forms data' });
    }
  }
}

// Export singleton instance
export const emailOperationsFormController = new EmailOperationsFormController();
