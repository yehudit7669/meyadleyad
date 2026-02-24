/**
 * 📧 Email Types - מקור מרכזי לכל סוגי המיילים במערכת
 * 
 * כל שליחת מייל במערכת MUST להשתמש באחד מהערכים הללו
 * אין שליחות מיילים לפי מחרוזות חופשיות
 */

export enum EmailType {
  // ✅ Authentication & Registration
  USER_REGISTER_CONFIRMATION = 'USER_REGISTER_CONFIRMATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_DELETION_CONFIRMATION = 'ACCOUNT_DELETION_CONFIRMATION',

  // ✅ Email Operations - User Not Registered
  USER_NOT_REGISTERED_REDIRECT_TO_SIGNUP = 'USER_NOT_REGISTERED_REDIRECT_TO_SIGNUP',

  // ✅ Email Operations - Ad Publishing
  AD_PUBLISH_REQUEST_RECEIVED = 'AD_PUBLISH_REQUEST_RECEIVED',
  AD_WANTED_REQUEST_RECEIVED = 'AD_WANTED_REQUEST_RECEIVED',
  AD_UPDATE_REQUEST_RECEIVED = 'AD_UPDATE_REQUEST_RECEIVED',
  AD_REMOVE_REQUEST_RECEIVED = 'AD_REMOVE_REQUEST_RECEIVED',
  AD_FORM_LINK_SENT = 'AD_FORM_LINK_SENT',

  // ✅ Ad Lifecycle - Status Updates
  AD_CREATED_PENDING_APPROVAL = 'AD_CREATED_PENDING_APPROVAL',
  AD_APPROVED = 'AD_APPROVED',
  AD_REJECTED = 'AD_REJECTED',
  AD_COPY_WITH_PDF = 'AD_COPY_WITH_PDF',
  AD_UPDATED_CONFIRMATION = 'AD_UPDATED_CONFIRMATION',
  AD_REMOVED_CONFIRMATION = 'AD_REMOVED_CONFIRMATION',

  // ✅ Appointments
  APPOINTMENT_REQUEST_SENT = 'APPOINTMENT_REQUEST_SENT',
  APPOINTMENT_APPROVED = 'APPOINTMENT_APPROVED',
  APPOINTMENT_REJECTED = 'APPOINTMENT_REJECTED',
  APPOINTMENT_RESCHEDULE = 'APPOINTMENT_RESCHEDULE',

  // ✅ Broker Contact
  BROKER_CONTACT_REQUEST = 'BROKER_CONTACT_REQUEST',

  // ✅ Email Operations - Mailing List
  MAILING_LIST_SUBSCRIBED = 'MAILING_LIST_SUBSCRIBED',
  MAILING_LIST_UNSUBSCRIBED = 'MAILING_LIST_UNSUBSCRIBED',
  MAILING_LIST_PREFERENCES_UPDATED = 'MAILING_LIST_PREFERENCES_UPDATED',

  // ✅ Content Distribution
  WEEKLY_CONTENT_DISTRIBUTION = 'WEEKLY_CONTENT_DISTRIBUTION',
  MANUAL_CONTENT_DISTRIBUTION = 'MANUAL_CONTENT_DISTRIBUTION',

  // ✅ Email Operations - Errors
  AD_NOT_FOUND = 'AD_NOT_FOUND',
  UNAUTHORIZED_ACTION = 'UNAUTHORIZED_ACTION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EMAIL_OPERATION_ERROR = 'EMAIL_OPERATION_ERROR',

  // ✅ Admin Notifications
  ADMIN_NOTIFICATION = 'ADMIN_NOTIFICATION',
  NEWSPAPER_SHEET_READY = 'NEWSPAPER_SHEET_READY',
}

/**
 * מטאדטה לכל סוג מייל
 */
export interface EmailTypeMetadata {
  type: EmailType;
  subject: string;
  description: string;
  requiresAuth: boolean;
  category: 'auth' | 'ads' | 'appointments' | 'mailing' | 'distribution' | 'errors' | 'admin';
}

/**
 * מיפוי מלא של כל סוגי המיילים
 */
export const EMAIL_TYPE_METADATA: Record<EmailType, EmailTypeMetadata> = {
  // Authentication & Registration
  [EmailType.USER_REGISTER_CONFIRMATION]: {
    type: EmailType.USER_REGISTER_CONFIRMATION,
    subject: 'אימות כתובת מייל - המקום',
    description: 'מייל אימות לאחר הרשמה',
    requiresAuth: false,
    category: 'auth',
  },
  [EmailType.PASSWORD_RESET]: {
    type: EmailType.PASSWORD_RESET,
    subject: 'איפוס סיסמה - המקום',
    description: 'מייל איפוס סיסמה',
    requiresAuth: false,
    category: 'auth',
  },
  [EmailType.ACCOUNT_DELETION_CONFIRMATION]: {
    type: EmailType.ACCOUNT_DELETION_CONFIRMATION,
    subject: 'החשבון שלך נמחק - המקום',
    description: 'אישור מחיקת חשבון',
    requiresAuth: false,
    category: 'auth',
  },

  // Email Operations - User Not Registered
  [EmailType.USER_NOT_REGISTERED_REDIRECT_TO_SIGNUP]: {
    type: EmailType.USER_NOT_REGISTERED_REDIRECT_TO_SIGNUP,
    subject: 'נדרשת הרשמה - המקום',
    description: 'הפניה להרשמה למשתמש לא רשום',
    requiresAuth: false,
    category: 'ads',
  },

  // Email Operations - Ad Publishing
  [EmailType.AD_PUBLISH_REQUEST_RECEIVED]: {
    type: EmailType.AD_PUBLISH_REQUEST_RECEIVED,
    subject: 'בקשתך לפרסום מודעה התקבלה - המקום',
    description: 'אישור קבלת בקשה לפרסום מודעה',
    requiresAuth: true,
    category: 'ads',
  },
  [EmailType.AD_WANTED_REQUEST_RECEIVED]: {
    type: EmailType.AD_WANTED_REQUEST_RECEIVED,
    subject: 'בקשתך לפרסום דרושים התקבלה - המקום',
    description: 'אישור קבלת בקשה לפרסום דרושים',
    requiresAuth: true,
    category: 'ads',
  },
  [EmailType.AD_UPDATE_REQUEST_RECEIVED]: {
    type: EmailType.AD_UPDATE_REQUEST_RECEIVED,
    subject: 'בקשתך לעדכון מודעה התקבלה - המקום',
    description: 'אישור קבלת בקשה לעדכון',
    requiresAuth: true,
    category: 'ads',
  },
  [EmailType.AD_REMOVE_REQUEST_RECEIVED]: {
    type: EmailType.AD_REMOVE_REQUEST_RECEIVED,
    subject: 'בקשתך להסרת מודעה התקבלה - המקום',
    description: 'אישור קבלת בקשה להסרה',
    requiresAuth: true,
    category: 'ads',
  },
  [EmailType.AD_FORM_LINK_SENT]: {
    type: EmailType.AD_FORM_LINK_SENT,
    subject: 'קישור לטופס פרסום - המקום',
    description: 'שליחת קישור לטופס Google Forms',
    requiresAuth: true,
    category: 'ads',
  },

  // Ad Lifecycle - Status Updates
  [EmailType.AD_CREATED_PENDING_APPROVAL]: {
    type: EmailType.AD_CREATED_PENDING_APPROVAL,
    subject: 'המודעה שלך התקבלה והועברה לאישור - המקום',
    description: 'מודעה נוצרה וממתינה לאישור מנהל',
    requiresAuth: true,
    category: 'ads',
  },
  [EmailType.AD_APPROVED]: {
    type: EmailType.AD_APPROVED,
    subject: 'המודעה שלך אושרה ופורסמה בהצלחה - המקום',
    description: 'מודעה אושרה על ידי מנהל',
    requiresAuth: true,
    category: 'ads',
  },
  [EmailType.AD_REJECTED]: {
    type: EmailType.AD_REJECTED,
    subject: 'המודעה שלך לא אושרה לפרסום - המקום',
    description: 'מודעה נדחתה על ידי מנהל',
    requiresAuth: true,
    category: 'ads',
  },
  [EmailType.AD_COPY_WITH_PDF]: {
    type: EmailType.AD_COPY_WITH_PDF,
    subject: 'המודעה שלך פורסמה - הנה העותק האישי שלך',
    description: 'שליחת PDF של המודעה',
    requiresAuth: true,
    category: 'ads',
  },
  [EmailType.AD_UPDATED_CONFIRMATION]: {
    type: EmailType.AD_UPDATED_CONFIRMATION,
    subject: 'המודעה עודכנה בהצלחה - המקום',
    description: 'אישור עדכון מודעה',
    requiresAuth: true,
    category: 'ads',
  },
  [EmailType.AD_REMOVED_CONFIRMATION]: {
    type: EmailType.AD_REMOVED_CONFIRMATION,
    subject: 'המודעה הוסרה בהצלחה - המקום',
    description: 'אישור הסרת מודעה',
    requiresAuth: true,
    category: 'ads',
  },

  // Appointments
  [EmailType.APPOINTMENT_REQUEST_SENT]: {
    type: EmailType.APPOINTMENT_REQUEST_SENT,
    subject: 'בקשה חדשה להצגת נכס - המקום',
    description: 'התראה למפרסם על בקשת פגישה',
    requiresAuth: true,
    category: 'appointments',
  },
  [EmailType.APPOINTMENT_APPROVED]: {
    type: EmailType.APPOINTMENT_APPROVED,
    subject: 'הפגישה אושרה! - המקום',
    description: 'אישור פגישה + קובץ ICS',
    requiresAuth: true,
    category: 'appointments',
  },
  [EmailType.APPOINTMENT_REJECTED]: {
    type: EmailType.APPOINTMENT_REJECTED,
    subject: 'הפגישה נדחתה - המקום',
    description: 'דחיית בקשת פגישה',
    requiresAuth: true,
    category: 'appointments',
  },
  [EmailType.APPOINTMENT_RESCHEDULE]: {
    type: EmailType.APPOINTMENT_RESCHEDULE,
    subject: 'הצעה למועד פגישה חלופי - המקום',
    description: 'הצעת מועד חלופי לפגישה',
    requiresAuth: true,
    category: 'appointments',
  },

  // Broker Contact
  [EmailType.BROKER_CONTACT_REQUEST]: {
    type: EmailType.BROKER_CONTACT_REQUEST,
    subject: 'פניה חדשה ממשתמש - המקום',
    description: 'התראה למתווך על פניה חדשה',
    requiresAuth: false,
    category: 'appointments',
  },

  // Email Operations - Mailing List
  [EmailType.MAILING_LIST_SUBSCRIBED]: {
    type: EmailType.MAILING_LIST_SUBSCRIBED,
    subject: 'נרשמת לרשימת התפוצה - המקום',
    description: 'אישור הרשמה לרשימת תפוצה',
    requiresAuth: true,
    category: 'mailing',
  },
  [EmailType.MAILING_LIST_UNSUBSCRIBED]: {
    type: EmailType.MAILING_LIST_UNSUBSCRIBED,
    subject: 'בוטלה ההרשמה לרשימת התפוצה - המקום',
    description: 'אישור ביטול הרשמה',
    requiresAuth: true,
    category: 'mailing',
  },
  [EmailType.MAILING_LIST_PREFERENCES_UPDATED]: {
    type: EmailType.MAILING_LIST_PREFERENCES_UPDATED,
    subject: 'העדפות רשימת התפוצה עודכנו - המקום',
    description: 'אישור עדכון העדפות',
    requiresAuth: true,
    category: 'mailing',
  },

  // Content Distribution
  [EmailType.WEEKLY_CONTENT_DISTRIBUTION]: {
    type: EmailType.WEEKLY_CONTENT_DISTRIBUTION,
    subject: 'תפוצת תוכן שבועית - המקום',
    description: 'תפוצה שבועית אוטומטית',
    requiresAuth: false,
    category: 'distribution',
  },
  [EmailType.MANUAL_CONTENT_DISTRIBUTION]: {
    type: EmailType.MANUAL_CONTENT_DISTRIBUTION,
    subject: 'תפוצת תוכן - המקום',
    description: 'תפוצה ידנית על ידי מנהל',
    requiresAuth: false,
    category: 'distribution',
  },

  // Email Operations - Errors
  [EmailType.AD_NOT_FOUND]: {
    type: EmailType.AD_NOT_FOUND,
    subject: 'המודעה לא נמצאה - המקום',
    description: 'שגיאה - מודעה לא קיימת',
    requiresAuth: false,
    category: 'errors',
  },
  [EmailType.UNAUTHORIZED_ACTION]: {
    type: EmailType.UNAUTHORIZED_ACTION,
    subject: 'פעולה לא מורשית - המקום',
    description: 'שגיאה - אין הרשאה',
    requiresAuth: false,
    category: 'errors',
  },
  [EmailType.RATE_LIMIT_EXCEEDED]: {
    type: EmailType.RATE_LIMIT_EXCEEDED,
    subject: 'חרגת ממכסת המיילים - המקום',
    description: 'שגיאה - rate limit',
    requiresAuth: false,
    category: 'errors',
  },
  [EmailType.EMAIL_OPERATION_ERROR]: {
    type: EmailType.EMAIL_OPERATION_ERROR,
    subject: 'שגיאה בעיבוד הבקשה - המקום',
    description: 'שגיאה כללית',
    requiresAuth: false,
    category: 'errors',
  },

  // Admin Notifications
  [EmailType.ADMIN_NOTIFICATION]: {
    type: EmailType.ADMIN_NOTIFICATION,
    subject: 'התראת מנהל - המקום',
    description: 'התראה כללית למנהלים',
    requiresAuth: true,
    category: 'admin',
  },
  [EmailType.NEWSPAPER_SHEET_READY]: {
    type: EmailType.NEWSPAPER_SHEET_READY,
    subject: 'גיליון עיתון מוכן - המקום',
    description: 'התראה שגיליון עיתון מוכן',
    requiresAuth: true,
    category: 'admin',
  },
};

/**
 * Helper functions
 */
export function getEmailTypeMetadata(type: EmailType): EmailTypeMetadata {
  return EMAIL_TYPE_METADATA[type];
}

export function getEmailSubject(type: EmailType): string {
  return EMAIL_TYPE_METADATA[type].subject;
}

export function getAllEmailTypes(): EmailType[] {
  return Object.values(EmailType);
}

export function getEmailTypesByCategory(
  category: 'auth' | 'ads' | 'appointments' | 'mailing' | 'distribution' | 'errors' | 'admin'
): EmailType[] {
  return Object.values(EmailType).filter(
    (type) => EMAIL_TYPE_METADATA[type].category === category
  );
}
