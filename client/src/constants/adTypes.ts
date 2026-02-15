import { AdType } from '../types/wizard';

export interface AdTypeOption {
  type: AdType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const AD_TYPE_OPTIONS: AdTypeOption[] = [
  {
    type: AdType.FOR_SALE,
    title: 'דירה לקניה',
    description: 'פרסם דירה למכירה',
    icon: '🏠',
    color: 'bg-blue-500',
  },
  {
    type: AdType.FOR_RENT,
    title: 'דירה להשכרה',
    description: 'פרסם דירה להשכרה',
    icon: '🔑',
    color: 'bg-green-500',
  },
  {
    type: AdType.UNIT,
    title: 'יחידת דיור',
    description: 'פרסם יחידת דיור',
    icon: '🏡',
    color: 'bg-purple-500',
  },
  {
    type: AdType.HOLIDAY_RENT,
    title: 'דירות לשבת',
    description: 'אני מציע דירה לשבת/חג',
    icon: '🕯️',
    color: 'bg-indigo-500',
  },
  {
    type: AdType.SERVICE_PROVIDERS,
    title: 'נותני שירות',
    description: 'מתווכים, קבלנים ובעלי מקצוע',
    icon: '🔧',
    color: 'bg-pink-500',
  },
  {
    type: AdType.PROJECT,
    title: 'פרויקטים',
    description: 'פרסם פרויקט בנייה',
    icon: '🏗️',
    color: 'bg-yellow-500',
  },
  {
    type: AdType.COMMERCIAL,
    title: 'נדל״ן מסחרי',
    description: 'פרסם נכס מסחרי',
    icon: '🏢',
    color: 'bg-orange-500',
  },
  {
    type: AdType.JOB,
    title: 'דרושים',
    description: 'אני מחפש נכס',
    icon: '🔍',
    color: 'bg-red-500',
  },
];

// Wanted (מחפש) sub-types
export const WANTED_TYPE_OPTIONS = [
  {
    type: AdType.WANTED_FOR_SALE,
    title: 'דירה לקניה',
    description: 'מחפש לקנות דירה',
    icon: '🏠',
    color: 'bg-blue-500',
  },
  {
    type: AdType.WANTED_FOR_RENT,
    title: 'דירה להשכרה',
    description: 'מחפש לשכור דירה',
    icon: '🔑',
    color: 'bg-green-500',
  },
  {
    type: AdType.WANTED_HOLIDAY,
    title: 'דרוש דירה לשבת',
    description: 'מחפש דירה לשבת/חג',
    icon: '🕯️',
    color: 'bg-indigo-500',
  },
  {
    type: AdType.WANTED_COMMERCIAL,
    title: 'נדל"ן מסחרי',
    description: 'מחפש נכס מסחרי (בקרוב)',
    icon: '🏢',
    color: 'bg-orange-500',
  },
];

export const PROPERTY_TYPE_OPTIONS = [
  { value: 'APARTMENT', label: 'דירה' },
  { value: 'DUPLEX', label: 'דופלקס' },
  { value: 'PENTHOUSE', label: 'פנטהאוז' },
  { value: 'TWO_STORY', label: 'דו קומתי' },
  { value: 'SEMI_DETACHED', label: 'דו משפחתי' },
  { value: 'GARDEN_APARTMENT', label: 'דירת גן' },
  { value: 'PRIVATE_HOUSE', label: 'בית פרטי' },
  { value: 'STUDIO', label: 'סטודיו' },
  { value: 'COTTAGE', label: 'קוטג׳' },
  { value: 'VILLA', label: 'וילה' },
  { value: 'UNIT', label: 'יחידת דיור' },
];

export const ROOMS_OPTIONS = [
  { value: 1, label: '1' },
  { value: 1.5, label: '1.5' },
  { value: 2, label: '2' },
  { value: 2.5, label: '2.5' },
  { value: 3, label: '3' },
  { value: 3.5, label: '3.5' },
  { value: 4, label: '4' },
  { value: 4.5, label: '4.5' },
  { value: 5, label: '5' },
  { value: 5.5, label: '5.5' },
  { value: 6, label: '6' },
  { value: 6.5, label: '6.5' },
  { value: 7, label: '7' },
  { value: 7.5, label: '7.5' },
  { value: 8, label: '8' },
];

export const CONDITION_OPTIONS = [
  { value: 'NEW_FROM_CONTRACTOR', label: 'חדש מקבלן' },
  { value: 'NEW', label: 'חדש' },
  { value: 'RENOVATED', label: 'משופץ' },
  { value: 'MAINTAINED', label: 'שמור' },
  { value: 'OLD', label: 'ישן' },
];

export const FURNITURE_OPTIONS = [
  { value: 'FULL', label: 'מלא' },
  { value: 'PARTIAL', label: 'חלקי' },
  { value: 'NONE', label: 'ללא' },
];

export const COMMERCIAL_TYPE_OPTIONS = [
  { value: 'STORE', label: 'חנות' },
  { value: 'OFFICE', label: 'משרד' },
  { value: 'WAREHOUSE', label: 'מחסן' },
  { value: 'HALL', label: 'אולם' },
];

export const PROJECT_STATUS_OPTIONS = [
  { value: 'PRE_MARKETING', label: 'שיווק מוקדם' },
  { value: 'UNDER_CONSTRUCTION', label: 'בבניה' },
  { value: 'PARTIALLY_OCCUPIED', label: 'מאוכלס חלקית' },
];

export const JOB_TYPE_OPTIONS = [
  { value: 'FULL_TIME', label: 'משרה מלאה' },
  { value: 'PART_TIME', label: 'משרה חלקית' },
  { value: 'FREELANCE', label: 'פרילנס' },
];

export const JOB_FIELD_OPTIONS = [
  { value: 'SALES', label: 'מכירות' },
  { value: 'ADMIN', label: 'אדמיניסטרציה' },
  { value: 'SERVICE', label: 'שירות' },
  { value: 'EDUCATION', label: 'הוראה' },
  { value: 'TECH', label: 'טכנולוגיה' },
  { value: 'HEALTHCARE', label: 'בריאות' },
  { value: 'CONSTRUCTION', label: 'בנייה' },
  { value: 'OTHER', label: 'אחר' },
];

// Holiday Rent Constants
export const PARASHA_OPTIONS = [
  { value: 'בראשית', label: 'בראשית' },
  { value: 'נח', label: 'נח' },
  { value: 'לך לך', label: 'לך לך' },
  { value: 'וירא', label: 'וירא' },
  { value: 'חיי שרה', label: 'חיי שרה' },
  { value: 'תולדות', label: 'תולדות' },
  { value: 'ויצא', label: 'ויצא' },
  { value: 'וישלח', label: 'וישלח' },
  { value: 'וישב', label: 'וישב' },
  { value: 'מקץ', label: 'מקץ' },
  { value: 'ויגש', label: 'ויגש' },
  { value: 'ויחי', label: 'ויחי' },
  { value: 'שמות', label: 'שמות' },
  { value: 'וארא', label: 'וארא' },
  { value: 'בא', label: 'בא' },
  { value: 'בשלח', label: 'בשלח' },
  { value: 'יתרו', label: 'יתרו' },
  { value: 'משפטים', label: 'משפטים' },
  { value: 'תרומה', label: 'תרומה' },
  { value: 'תצוה', label: 'תצוה' },
  { value: 'כי תשא', label: 'כי תשא' },
  { value: 'ויקהל', label: 'ויקהל' },
  { value: 'פקודי', label: 'פקודי' },
  { value: 'ויקרא', label: 'ויקרא' },
  { value: 'צו', label: 'צו' },
  { value: 'שמיני', label: 'שמיני' },
  { value: 'תזריע', label: 'תזריע' },
  { value: 'מצורע', label: 'מצורע' },
  { value: 'אחרי מות', label: 'אחרי מות' },
  { value: 'קדושים', label: 'קדושים' },
  { value: 'אמור', label: 'אמור' },
  { value: 'בהר', label: 'בהר' },
  { value: 'בחוקותי', label: 'בחוקותי' },
  { value: 'במדבר', label: 'במדבר' },
  { value: 'נשא', label: 'נשא' },
  { value: 'בהעלותך', label: 'בהעלותך' },
  { value: 'שלח', label: 'שלח' },
  { value: 'קרח', label: 'קרח' },
  { value: 'חוקת', label: 'חוקת' },
  { value: 'בלק', label: 'בלק' },
  { value: 'פנחס', label: 'פנחס' },
  { value: 'מטות', label: 'מטות' },
  { value: 'מסעי', label: 'מסעי' },
  { value: 'דברים', label: 'דברים' },
  { value: 'ואתחנן', label: 'ואתחנן' },
  { value: 'עקב', label: 'עקב' },
  { value: 'ראה', label: 'ראה' },
  { value: 'שופטים', label: 'שופטים' },
  { value: 'כי תצא', label: 'כי תצא' },
  { value: 'כי תבוא', label: 'כי תבוא' },
  { value: 'נצבים', label: 'נצבים' },
  { value: 'וילך', label: 'וילך' },
  { value: 'האזינו', label: 'האזינו' },
  { value: 'וזאת הברכה', label: 'וזאת הברכה' },
];

export const PURPOSE_OPTIONS = [
  { value: 'HOSTING', label: 'אירוח' },
  { value: 'SLEEPING_ONLY', label: 'לינה בלבד' },
];

export const BALCONIES_COUNT_OPTIONS = [
  { value: 0, label: 'ללא' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
];

