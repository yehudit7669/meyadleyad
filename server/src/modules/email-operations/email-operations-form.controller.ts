/**
 * Email Operations Form Submission Controller
 * טיפול בטפסים שנשלחו דרך Google Forms או טפסים מותאמים אישית
 * 
 * מקבל נתוני טופס ויוצר מודעה/בקשה בסטטוס PENDING
 * לאחר אישור המנהל - נשלח מייל אישור פרסום
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { emailPermissionsService } from '../admin/email-permissions.service';
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

      // Auto-approve for ADMIN and SUPER_ADMIN
      const isAdminOrSuperAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      
      // Check if user has special permission to publish without approval
      const hasPublishPermission = await emailPermissionsService.hasPermission(user.email, 'publish_without_approval');
      
      const shouldAutoApprove = isAdminOrSuperAdmin || hasPublishPermission;
      const adStatus = shouldAutoApprove ? 'ACTIVE' : 'PENDING';

      // אם יש שם עיר אבל אין cityId, חפש את העיר
      let cityId = formData.cityId;
      if (!cityId && formData.cityName) {
        const city = await prisma.city.findFirst({
          where: {
            OR: [
              { name: formData.cityName },
              { nameHe: formData.cityName },
            ],
          },
        });
        if (city) {
          cityId = city.id;
        }
      }

      // בניית כתובת מלאה אם לא הוגדרה
      let address = formData.address;
      if (!address && formData.customFields) {
        const addressParts: string[] = [];
        
        // הוסף רחוב ומספר בית אם יש
        if (formData.customFields.street) {
          addressParts.push(formData.customFields.street);
        }
        if (formData.customFields.houseNumber) {
          addressParts.push(formData.customFields.houseNumber);
        }
        if (formData.customFields.addressAddition) {
          addressParts.push(formData.customFields.addressAddition);
        }
        
        // אם יש שכונה, הוסף אותה
        if (formData.customFields.neighborhood) {
          addressParts.push(`שכונת ${formData.customFields.neighborhood}`);
        }
        
        // אם יש עיר, הוסף אותה
        if (formData.cityName) {
          addressParts.push(formData.cityName);
        }
        
        if (addressParts.length > 0) {
          address = addressParts.join(', ');
        }
      }

      // בניית תיאור אם לא הוגדר
      let description = formData.description?.trim() || '';
      if (!description && formData.customFields) {
        const descParts: string[] = [];
        
        if (formData.customFields.propertyType) descParts.push(`סוג: ${formData.customFields.propertyType}`);
        if (formData.customFields.rooms) descParts.push(`${formData.customFields.rooms} חדרים`);
        if (formData.customFields.squareMeters) descParts.push(`${formData.customFields.squareMeters} מ"ר`);
        if (formData.customFields.floor) descParts.push(`קומה ${formData.customFields.floor}`);
        if (formData.customFields.neighborhood) descParts.push(`שכונת ${formData.customFields.neighborhood}`);
        
        if (descParts.length > 0) {
          description = descParts.join(' | ');
        } else {
          description = 'פרטים נוספים יתווספו בקרוב';
        }
      }

      console.log('📋 Creating ad with customFields:', JSON.stringify(formData.customFields, null, 2));

      // בדיקה למניעת מודעות כפולות - בודק אם כבר נוצרה מודעה דומה ב-30 השניות האחרונות
      const recentAd = await prisma.ad.findFirst({
        where: {
          userId: user.id,
          title: formData.title,
          categoryId: category.id,
          createdAt: {
            gte: new Date(Date.now() - 30000), // 30 שניות אחורה
          },
        },
      });

      if (recentAd) {
        console.log('⚠️ Duplicate ad detected, returning existing ad:', recentAd.adNumber);
        res.status(200).json({
          success: true,
          message: 'Ad already exists (duplicate prevented)',
          adId: recentAd.id,
          adNumber: recentAd.adNumber,
        });
        return;
      }

      // יצירת המודעה
      const ad = await prisma.ad.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          categoryId: category.id,
          cityId: cityId,
          streetId: formData.streetId,
          title: formData.title,
          description: description,
          price: formData.price,
          address: address,
          customFields: formData.customFields || {},
          status: adStatus,
          publishedAt: shouldAutoApprove ? new Date() : null,
          isWanted: formData.isWanted || false,
          requestedLocationText: formData.requestedLocationText,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Created ad ${ad.adNumber} in ${adStatus} status`);

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
      console.log('📝 Received Google Forms webhook');
      console.log('Raw data:', JSON.stringify(req.body, null, 2));

      // נתונים מ-Google Forms יגיעו בפורמט שונה
      // צריך לנרמל אותם לפורמט שלנו
      const rawData = req.body;

      // תמיכה בפורמט של Apps Script (שדות אנגלית) + fallback לשדות עבריים
      const formData: FormSubmissionData = {
        senderEmail: rawData.senderEmail || rawData.email || rawData['כתובת אימייל'],
        userName: rawData.userName || rawData.name || rawData['שם מלא'],
        userPhone: rawData.userPhone || rawData.phone || rawData['טלפון'],
        formType: rawData.formType || 'publish',
        category: rawData.category || rawData['קטגוריה'],
        title: rawData.title || rawData['כותרת'],
        description: rawData.description || rawData['תיאור'] || '',
        price: rawData.price ? parseFloat(rawData.price.toString()) : undefined,
        cityName: rawData.cityName || rawData.city || rawData['עיר'],
        address: rawData.address || rawData['כתובת'] || rawData['רחוב ומספר בית'],
        customFields: rawData.customFields || {},
      };

      console.log('✅ Normalized form data:', JSON.stringify(formData, null, 2));

      // קריאה לטיפול הרגיל - זה ישלח תשובה בעצמו
      req.body = formData;
      return await this.handleFormSubmission(req, res);
    } catch (error) {
      console.error('❌ Error in Google Forms webhook:', error);
      console.error('Error details:', error);
      
      // רק אם עדיין לא נשלחה תשובה
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to process Google Forms data',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
}

// Export singleton instance
export const emailOperationsFormController = new EmailOperationsFormController();
