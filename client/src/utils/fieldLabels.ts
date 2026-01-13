/**
 * Field Labels and Formatters
 * מיפוי שדות לעברית ופורמט ערכים
 */

// מיפוי שדות נפוצים לעברית
export const FIELD_LABELS: Record<string, string> = {
  // כללי
  title: 'כותרת',
  description: 'תיאור',
  price: 'מחיר',
  address: 'כתובת',
  
  // פרטי נכס
  rooms: 'חדרים',
  floor: 'קומה',
  squareMeters: 'שטח (מ״ר)',
  size: 'שטח (מ״ר)',
  area: 'שטח (מ״ר)',
  houseNumber: 'מספר בית',
  
  // מאפיינים
  parking: 'חניה',
  elevator: 'מעלית',
  balcony: 'מרפסת',
  balconies: 'מרפסות',
  furnished: 'מרוהט',
  storage: 'מחסן',
  airConditioning: 'מיזוג אוויר',
  heating: 'חימום',
  mamad: 'ממ"ד',
  view: 'נוף',
  housingUnit: 'יחידת דיור',
  yard: 'חצר',
  option: 'אופציה',
  
  // סוגים ומצב
  propertyType: 'סוג נכס',
  condition: 'מצב',
  furniture: 'ריהוט',
  
  // תשלומים
  arnona: 'ארנונה',
  vaad: 'ועד בית',
  
  // תאריכים ותיווך
  entryDate: 'תאריך כניסה',
  availableFrom: 'זמין מתאריך',
  hasBroker: 'דרך תיווך',
  broker: 'מתווך',
  
  // דירות נופש
  plata: 'פלטה',
  urn: 'מיחם',
  linens: 'מצעים',
  pool: 'בריכה',
  kidsGames: 'משחקי ילדים',
  babyBed: 'מיטת תינוק',
  masterUnit: 'יחידת הורים',
  sleepingOnly: 'לינה בלבד',
  
  // רכב
  year: 'שנה',
  mileage: 'קילומטראז׳',
  engineVolume: 'נפח מנוע',
  color: 'צבע',
  transmission: 'תיבת הילוכים',
  
  // משרות
  jobType: 'סוג משרה',
  location: 'מיקום',
  experience: 'ניסיון נדרש',
  education: 'השכלה',
  
  // עסקים
  businessType: 'סוג עסק',
  monthlyRevenue: 'הכנסה חודשית',
  numberOfEmployees: 'מספר עובדים',
  
  // פרטי קשר
  contactName: 'שם איש קשר',
  contactPhone: 'טלפון ליצירת קשר',
  addressSupplement: 'השלמת כתובת',
};

// מיפוי ערכים enum לעברית
export const ENUM_VALUES: Record<string, Record<string, string>> = {
  // מצב נכס
  condition: {
    NEW: 'חדש',
    EXCELLENT: 'מצוין',
    GOOD: 'טוב',
    MAINTAINED: 'מתוחזק',
    RENOVATED: 'משופץ',
    NEEDS_RENOVATION: 'דרוש שיפוץ',
    OLD: 'ישן',
  },
  
  // סוג נכס
  propertyType: {
    APARTMENT: 'דירה',
    HOUSE: 'בית פרטי',
    GARDEN_APARTMENT: 'דירת גן',
    PENTHOUSE: 'פנטהאוז',
    DUPLEX: 'דופלקס',
    STUDIO: 'סטודיו',
    COTTAGE: 'קוטג\'',
    VILLA: 'וילה',
    TOWNHOUSE: 'בית טורי',
  },
  
  // ריהוט
  furniture: {
    NONE: 'ללא',
    PARTIAL: 'חלקי',
    FULL: 'מלא',
    FURNISHED: 'מרוהט',
    UNFURNISHED: 'לא מרוהט',
  },
};

/**
 * פורמט ערך לפי סוג
 */
export function formatFieldValue(key: string, value: any): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  // Enum values - תרגום ערכים באנגלית
  if (typeof value === 'string' && ENUM_VALUES[key]?.[value]) {
    return ENUM_VALUES[key][value];
  }

  // Boolean
  if (typeof value === 'boolean') {
    return value ? 'כן' : 'לא';
  }

  // Date
  if (key.toLowerCase().includes('date') || key === 'availableFrom' || key === 'entryDate') {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('he-IL');
      }
    } catch {
      return value.toString();
    }
  }

  // מחיר
  if (key.toLowerCase().includes('price') || key === 'arnona' || key === 'vaad' || key === 'monthlyRevenue') {
    const num = Number(value);
    if (!isNaN(num)) {
      return `₪${num.toLocaleString('he-IL')}`;
    }
  }

  // שטח
  if (key === 'squareMeters' || key === 'size' || key === 'area') {
    const num = Number(value);
    if (!isNaN(num)) {
      return `${num} מ״ר`;
    }
  }

  // קילומטראז׳
  if (key === 'mileage') {
    const num = Number(value);
    if (!isNaN(num)) {
      return `${num.toLocaleString('he-IL')} ק״מ`;
    }
  }

  // ברירת מחדל
  return value.toString();
}

/**
 * קבל תווית בעברית לשדה
 */
export function getFieldLabel(key: string): string {
  return FIELD_LABELS[key] || key;
}

/**
 * פורמט אובייקט customFields למבנה תצוגה
 */
export function formatCustomFields(customFields: Record<string, any>): Array<{ label: string; value: string }> {
  if (!customFields || typeof customFields !== 'object') {
    return [];
  }

  const formatted: Array<{ label: string; value: string }> = [];

  Object.entries(customFields).forEach(([key, value]) => {
    // דלג על אובייקטים ו-features (הם מטופלים בנפרד)
    if (typeof value === 'object' || key === 'features') {
      return;
    }

    const label = getFieldLabel(key);
    const formattedValue = formatFieldValue(key, value);

    formatted.push({ label, value: formattedValue });
  });

  return formatted;
}

/**
 * בדיקה אם שדה הוא feature (checkbox)
 */
export function isFeatureField(key: string, value: any): boolean {
  return typeof value === 'boolean' && (
    key === 'parking' ||
    key === 'elevator' ||
    key === 'balcony' ||
    key === 'storage' ||
    key === 'plata' ||
    key === 'urn' ||
    key === 'linens' ||
    key === 'pool' ||
    key === 'kidsGames' ||
    key === 'babyBed' ||
    key === 'masterUnit' ||
    key === 'sleepingOnly' ||
    key === 'airConditioning' ||
    key === 'heating' ||
    key === 'furnished'
  );
}
