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
import { AuthService } from '../auth/auth.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface FormSubmissionData {
  // זיהוי
  senderEmail: string;
  userName?: string;
  userPhone?: string;

  // סוג הפעולה
  formType: 'publish' | 'wanted' | 'registration';
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

      // טיפול מיוחד בטופס הרשמה
      if (formData.formType === 'registration') {
        await this.handleRegistrationFormSubmission(formData, res);
        return;
      }

      // טיפול מיוחד בעדכון מודעה
      // אם יש adNumber ב-customFields, זה אומר שזה עדכון
      const adNumberToUpdate = formData.customFields?.adNumber;
      if (adNumberToUpdate) {
        await this.handleAdUpdateFormSubmission(formData, res);
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

      // מיפוי קטגוריות - תמיכה בשמות שונים לאותה קטגוריה
      const categoryMappings: Record<string, string> = {
        'שטחים מסחריים': 'נדל״ן מסחרי',
        'נדלן מסחרי': 'נדל״ן מסחרי',
        'דירה למכירה': 'דירות למכירה',
        'דירה להשכרה': 'דירות להשכרה',
        'יחידת דיור': 'יחידות דיור',
        'דירה לשבת': 'דירות לשבת',
        'טאבו משותף': 'טאבו משותף',
        'דרושה דירה לקניה': 'דרושים - דירות למכירה',
        'דרושה דירה להשכרה': 'דרושים - דירות להשכרה',
        'דרושה דירה לשבת': 'דרושים - דירות לשבת',
        'דרושים - נדלן מסחרי': 'דרושים - נדל״ן מסחרי',
        'דרושים נדלן מסחרי': 'דרושים - נדל״ן מסחרי',
      };

      // נרמול שם הקטגוריה
      const normalizedCategory = categoryMappings[formData.category] || formData.category;

      // מציאת הקטגוריה
      const category = await prisma.category.findFirst({
        where: {
          OR: [
            { nameHe: normalizedCategory },
            { name: normalizedCategory },
            { nameHe: formData.category }, // גם השם המקורי
            { name: formData.category },
          ],
        },
      });

      if (!category) {
        console.error(`❌ Category not found: "${formData.category}" (normalized: "${normalizedCategory}")`);
        res.status(400).json({ 
          error: 'Invalid category',
          details: `Category "${formData.category}" not found in system`
        });
        return;
      }

      console.log(`✅ Found category: ${category.nameHe} (from input: "${formData.category}")`);

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
   * טיפול בטופס הרשמה מ-Google Forms
   * יוצר משתמש חדש ומעבד Pending Intents
   */
  async handleRegistrationFormSubmission(formData: FormSubmissionData, res: Response) {
    try {
      console.log('📝 Processing registration form submission');
      
      const email = formData.senderEmail.toLowerCase().trim();
      const name = formData.userName || 'משתמש';
      const phone = formData.userPhone;
      
      // בדיקה שיש סיסמה
      const password = formData.customFields?.password;
      const passwordConfirm = formData.customFields?.passwordConfirm;
      
      if (!password) {
        res.status(400).json({ error: 'Password is required for registration' });
        return;
      }
      
      // בדיקה שהסיסמאות תואמות
      if (password !== passwordConfirm) {
        res.status(400).json({ error: 'Passwords do not match' });
        return;
      }
      
      // בדיקה אם המשתמש כבר קיים
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        res.status(400).json({ error: 'User already registered' });
        return;
      }
      
      // יצירת משתמש חדש
      const authService = new AuthService();
      
      const registrationData = {
        email,
        password,
        name,
        phone,
        role: 'USER' as const,
      };
      
      console.log('Creating new user:', { email, name, phone });
      
      const result = await authService.register(registrationData);
      
      console.log('✅ User created successfully:', result.user.id);
      
      // שליחת אימייל השלמת הרשמה
      await emailOperationsTemplates.sendRegistrationCompletedEmail(
        email,
        name
      );
      
      // עיבוד Pending Intents
      await emailOperationsOrchestrator.processPendingIntentsForUser(email, result.user.id);
      
      // אם המשתמש רוצה לקבל את הגיליון השבועי, הרשם אותו
      const weeklyDigestOptIn = formData.customFields?.weeklyDigestOptIn;
      if (weeklyDigestOptIn === true || weeklyDigestOptIn === 'true' || weeklyDigestOptIn === 'כן') {
        try {
          await prisma.user.update({
            where: { id: result.user.id },
            data: { weeklyDigestOptIn: true },
          });
          console.log('✅ User opted in to weekly digest');
        } catch (error) {
          console.error('⚠️ Failed to update weekly digest preference:', error);
        }
      }
      
      res.status(201).json({ 
        success: true,
        message: 'Registration successful',
        userId: result.user.id,
      });
      
    } catch (error) {
      console.error('❌ Error in registration form submission:', error);
      res.status(500).json({ 
        error: 'Failed to process registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * טיפול בעדכון מודעה דרך Google Forms
   * יוצר Pending Changes במקום עדכון ישיר (למודעות ACTIVE)
   */
  async handleAdUpdateFormSubmission(formData: FormSubmissionData, res: Response) {
    try {
      console.log('✏️ Processing ad update form submission');
      
      const email = formData.senderEmail.toLowerCase().trim();
      console.log(`📝 Update request from ${email}`);

      // בדיקה שהמשתמש קיים
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(403).json({ error: 'User not registered' });
        return;
      }

      // 🔒 חיפוש מספר המודעה המקורי ב-EmailAuditLog
      // חשוב: אנחנו משתמשים במספר שנרשם כשהמשתמש ביקש עדכון, לא במה שהמשתמש שלח בטופס!
      // זה מונע מהמשתמש לשנות את מספר המודעה בטופס ולערוך מודעה אחרת
      const recentUpdateRequest = await prisma.emailAuditLog.findFirst({
        where: {
          email: email,
          action: 'UPDATE_FORM_SENT',
          commandType: 'UPDATE_AD',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!recentUpdateRequest || !recentUpdateRequest.adId) {
        console.log(`❌ No recent update request found for ${email}`);
        res.status(403).json({ error: 'No update request found. Please send an email with "עדכון#<מספר_מודעה>" first.' });
        return;
      }

      const originalAdNumber = parseInt(recentUpdateRequest.adId);
      console.log(`🔒 Using original ad number from audit log: #${originalAdNumber}`);

      // בדיקה שמספר המודעה בטופס תואם למקורי (אם שונה - אזהרה)
      const submittedAdNumber = parseInt(formData.customFields?.adNumber);
      if (submittedAdNumber && submittedAdNumber !== originalAdNumber) {
        console.log(`⚠️ WARNING: User tried to change ad number from ${originalAdNumber} to ${submittedAdNumber}. Using original.`);
      }

      // מציאת המודעה ובדיקה שהיא שייכת למשתמש
      const ad = await prisma.ad.findFirst({
        where: {
          adNumber: originalAdNumber,
          userId: user.id,
        },
        include: {
          Category: true,
          City: true,
        },
      });

      if (!ad) {
        console.log(`❌ Ad #${originalAdNumber} not found or does not belong to user ${user.id}`);
        res.status(404).json({ error: 'Ad not found or does not belong to user' });
        return;
      }

      console.log(`✅ Ad found: #${ad.adNumber} belongs to user ${user.id}`);

      // מציאת הקטגוריה אם השתנתה
      let categoryId = ad.categoryId;
      if (formData.category && formData.category !== ad.Category.nameHe && formData.category !== ad.Category.name) {
        const newCategory = await prisma.category.findFirst({
          where: {
            OR: [
              { nameHe: formData.category },
              { name: formData.category },
            ],
          },
        });
        if (newCategory) {
          categoryId = newCategory.id;
        }
      }

      // אם יש שם עיר אבל cityId לא השתנה, חפש את העיר
      let cityId = formData.cityId || ad.cityId;
      if (formData.cityName) {
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

      // בניית customFields מעודכנים
      const updatedCustomFields = {
        ...(ad.customFields as any),
        ...formData.customFields,
      };
      
      // הסרת adNumber מה-customFields (הוא לא צריך להישמר שם)
      delete updatedCustomFields.adNumber;

      // בניית אובייקט שינויים ממתינים
      const pendingChanges = {
        title: formData.title,
        description: formData.description || ad.description,
        price: formData.price !== undefined ? formData.price : ad.price,
        categoryId,
        cityId,
        streetId: formData.streetId || ad.streetId,
        address: formData.address || ad.address,
        neighborhood: formData.neighborhood || ad.neighborhood,
        customFields: updatedCustomFields,
        requestedAt: new Date().toISOString(),
        requestedBy: user.id,
      };

      // אם המודעה ACTIVE - שמור כ-Pending Changes
      // אם לא ACTIVE - עדכן ישירות
      if (ad.status === 'ACTIVE') {
        // שמירת שינויים ממתינים
        await prisma.ad.update({
          where: { id: ad.id },
          data: {
            hasPendingChanges: true,
            pendingChanges: pendingChanges as any,
            pendingChangesAt: new Date(),
          },
        });

        console.log(`✅ Saved pending changes for ad ${ad.adNumber}`);

        res.status(200).json({
          success: true,
          message: 'Changes saved and pending admin approval',
          adNumber: ad.adNumber,
          hasPendingChanges: true,
        });

        // שליחת אימייל למשתמש המתאים
        await emailOperationsTemplates.sendAdUpdatedConfirmationEmail(
          email,
          ad.adNumber.toString()
        );

      } else {
        // מודעה לא ACTIVE - עדכן ישירות
        await prisma.ad.update({
          where: { id: ad.id },
          data: {
            title: formData.title,
            description: pendingChanges.description,
            price: pendingChanges.price,
            categoryId,
            cityId,
            streetId: pendingChanges.streetId,
            address: pendingChanges.address,
            neighborhood: pendingChanges.neighborhood,
            customFields: updatedCustomFields,
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Updated ad ${ad.adNumber} directly (status: ${ad.status})`);

        res.status(200).json({
          success: true,
          message: 'Ad updated successfully',
          adNumber: ad.adNumber,
        });
      }

      // תיעוד
      await emailAuditLogger.logSuccess({
        email,
        action: 'AD_UPDATE_FORM_SUBMITTED',
        commandType: EmailCommandType.UPDATE_AD,
        adId: ad.adNumber.toString(),
        userId: user.id,
      });

    } catch (error) {
      console.error('❌ Error in ad update form submission:', error);
      res.status(500).json({
        error: 'Failed to process ad update',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * קבלת נתוני מודעה לעריכה
   * GET /api/email-operations/forms/ad-data/:adNumber
   * מחזיר את כל נתוני המודעה בפורמט שמתאים למילוי Google Forms
   */
  async getAdDataForEdit(req: Request, res: Response) {
    try {
      const { adNumber } = req.params;
      
      // מציאת המודעה
      const ad = await prisma.ad.findFirst({
        where: { adNumber: parseInt(adNumber) },
        include: {
          User: true,
          Category: true,
          City: true,
          Street: true,
          AdImage: true,
        },
      });

      if (!ad) {
        res.status(404).json({ error: 'Ad not found' });
        return;
      }

      // בניית אובייקט נתונים לטופס
      const formData = {
        // פרטי משתמש
        senderEmail: ad.User.email,
        userName: ad.User.name,
        userPhone: ad.User.phone,
        
        // פרט מודעה
        adNumber: ad.adNumber,
        title: ad.title,
        description: ad.description || '',
        price: ad.price,
        category: ad.Category.nameHe || ad.Category.name,
        categoryId: ad.categoryId,
        
        // מיקום
        cityName: ad.City?.nameHe || ad.City?.name || '',
        cityId: ad.cityId,
        streetName: ad.Street?.name || '',
        streetId: ad.streetId,
        address: ad.address || '',
        neighborhood: ad.neighborhood || '',
        
        // שדות מותאמים
        customFields: (ad.customFields as any) || {},
        
        // תמונות
        images: ad.AdImage.map(img => ({
          url: img.url,
          order: img.order,
        })),
      };

      res.status(200).json(formData);
    } catch (error) {
      console.error('❌ Error getting ad data for edit:', error);
      res.status(500).json({ error: 'Failed to get ad data' });
    }
  }

  /**
   * קבלת URL לטופס עריכה עם prefill
   * GET /api/email-operations/forms/edit-url/:adNumber
   * מחזיר קישור לטופס Google Forms המתאים עם הנתונים הקיימים
   */
  async getEditFormUrl(req: Request, res: Response) {
    try {
      const { adNumber } = req.params;
      
      // מציאת המודעה
      const ad = await prisma.ad.findFirst({
        where: { adNumber: parseInt(adNumber) },
        include: {
          User: { select: { email: true } },
          Category: { select: { name: true, nameHe: true } },
        },
      });

      if (!ad) {
        res.status(404).json({ error: 'Ad not found' });
        return;
      }

      // זיהוי סוג הטופס לפי קטגוריה ו-adType
      const categoryName = (ad.Category.nameHe || ad.Category.name || '').toLowerCase();
      let formUrl = '';
      let entryId = '';
      
      if (ad.adType === 'WANTED') {
        // טפסי "דרוש"
        if (categoryName.includes('למכירה') || categoryName.includes('קנייה')) {
          formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdMwDw2sNMb5jPcBoIl6AJ-n9CQu0_80omLW3Ck3uIRW3TJyA/viewform';
          entryId = '449392419'; // דרושה דירה לקניה
        } else if (categoryName.includes('להשכרה') || categoryName.includes('שכירות')) {
          formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScPERp7DqSEqJQJfrOFvmc_Qn4PBjeK_A9Al8UQtKzL3Za7ZA/viewform';
          entryId = '365904041'; // דרושה דירה להשכרה
        } else if (categoryName.includes('שבת')) {
          formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfBeO33PMHLvQdikhCiIWxwRNWr7I-Thb2YtO-s6gpYQ9letQ/viewform';
          entryId = '1027845874'; // דרושה דירה לשבת
        } else if (categoryName.includes('מסחרי')) {
          formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSc9LedNhusFbQ7lUHlYlQmz8PVEZ6KvHv44inPHf5d7YT1g7g/viewform';
          entryId = '2122624981'; // דרושים - נדלן מסחרי
        } else if (categoryName.includes('טאבו משותף')) {
          formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSd6B2x9iYh-WsXT7bRis5tx-AAVvDDnQnT_Fp3nQa61bAsKsg/viewform';
          entryId = '1570047191'; // דרושים - טאבו משותף
        }
      } else {
        // טפסי פרסום
        if (categoryName.includes('למכירה')) {
          formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSd5ZjstupkxjBc9d7j7h3hOkIHVNgfjZLlCtPbB7j0cDmbt2w/viewform';
          entryId = '1648351638'; // דירה למכירה
        } else if (categoryName.includes('להשכרה')) {
          formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSc8JTt1ZTlzdS5uRiVzHYiJ0-6dZLJ4pcqW2-E8q6xuz1SOFA/viewform';
          entryId = '1505905751'; // דירה להשכרה
        } else if (categoryName.includes('שבת')) {
          formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfURSOKEw-gbIa2xdAgd9qWncXfa-zKgFhS96EER68i17T02A/viewform';
          entryId = '622992691'; // דירה לשבת
        } else if (categoryName.includes('יחידת דיור') || categoryName.includes('יחידות דיור')) {
          formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScLIOjFVcz2-Zoyt6AZ0TUQgpSeozTzGMnNVZxESzBRPOT_Hw/viewform';
          entryId = '1148879052'; // יחידת דיור
        } else if (categoryName.includes('מסחרי')) {
          formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfAD9q6J1H8AZD9pdniJX5bNjjpZZmGpfdIu40QKLWW0fdIGQ/viewform';
          entryId = '1904534500'; // נדלן מסחרי
        } else if (categoryName.includes('טאבו משותף')) {
          formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLServd1wD1AIEWJ1K1bLt1I9LiAVwRQN0kjOfFxHyW0Fc9EuVg/viewform';
          entryId = '1719612777'; // טאבו משותף
        }
      }

      if (!formUrl || !entryId) {
        res.status(400).json({ error: 'Could not determine form type for this ad' });
        return;
      }

      // הוספת מספר מודעה כ-parameter (ימלא מראש את השדה המוסתר)
      formUrl += `?usp=pp_url&entry.${entryId}=${ad.adNumber}`;

      res.status(200).json({ 
        formUrl,
        adNumber: ad.adNumber,
        message: 'Form URL for editing'
      });
    } catch (error) {
      console.error('❌ Error getting edit form URL:', error);
      res.status(500).json({ error: 'Failed to get edit form URL' });
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
