/**
 * Google Forms Apps Script - אינטגרציה עם מערכת המקום (יחידת דיור)
 * 
 * הוראות התקנה:
 * 1. פתח את טופס יחידת דיור ב-Google Forms
 * 2. לחץ על שלוש הנקודות ⋮ למעלה → Extensions → Apps Script
 * 3. מחק את הקוד הקיים והעתק את כל הקוד מכאן
 * 4. שמור (Ctrl+S)
 * 5. לחץ על השעון ⏰ (Triggers) בצד שמאל
 * 6. לחץ "Add Trigger" ובחר:
 *    - Function: onFormSubmit
 *    - Event source: From form
 *    - Event type: On form submit
 * 7. שמור את ה-Trigger
 * 
 * עכשיו כל מילוי טופס יישלח אוטומטית לשרת!
 */

// ===============================
// הגדרות - ערוך רק כאן!
// ===============================

// כתובת השרת שלך
const SERVER_URL = 'https://amakom.co.il/api/email-operations/forms/google-forms-webhook';

// סוג הפרסום (לפי הטופס)
const FORM_TYPE = 'publish';  // 'publish' או 'wanted'
const CATEGORY = 'יחידות דיור';  // שם הקטגוריה (חייב להיות בדיוק כמו בבסיס הנתונים!)

// ===============================
// מיפוי שדות הטופס לשדות המערכת
// ===============================
// ערוך את השמות בצד ימין לפי שמות השאלות בטופס שלך

const FIELD_MAPPING = {
  // שדות חובה
  // Google Forms יכול לאסוף אימייל בשתי דרכים:
  // 1. "Email Address" (אם מופעל "Collect email addresses")
  // 2. שאלה רגילה בשם "כתובת אימייל"
  email: 'Email Address',          // או 'כתובת אימייל' אם זו שאלה רגילה
  adNumber: 'מספר_מודעה',          // שדה מוסתר לעריכת מודעות קיימות
  name: 'שם',
  phone: 'טלפון',
  description: 'תיאור היחידה',
  
  // שדות מיקום
  city: 'עיר',
  neighborhood: 'שכונה',
  street: 'רחובות',
  houseNumber: 'מספר בית',
  addressAddition: 'תוספת כתובת (לדוג: דירה 14, כניסה ב\')',
  
  // מחיר
  price: 'מחיר מבוקש',
  arnona: 'ארנונה',
  vaadBayit: 'וועד בית (לחודש)',
  
  // פרטי הנכס
  propertyType: 'סוג היחידה',  // יחידת הורים, יחידה נפרדת וכו'
  rooms: 'מספר חדרים',
  squareMeters: 'שטח במ"ר',
  propertyCondition: 'מצב היחידה',
  floor: 'קומה',
  balconies: 'מרפסות',
  furniture: 'ריהוט',
  entryDate: 'תאריך כניסה',
  broker: 'תיווך ',  // שים לב לרווח בסוף!
  
  // מאפיינים (checkbox list)
  features: 'מאפיינים',
  
  // הרשמה ללוח
  subscribeToNewsletter: 'שלח לי את הלוח השבועי באימייל לאחר הפרסום',
};

// ===============================
// הפונקציה שרצה כש-Trigger מופעל
// ===============================

function onFormSubmit(e) {
  try {
    Logger.log('📝 Form submitted, processing...');
    
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    
    // קבלת אימייל המשיב (אם מופעל Collect email addresses)
    const respondentEmail = formResponse.getRespondentEmail();
    Logger.log('Respondent email: ' + respondentEmail);
    
    // יצירת אובייקט עם כל התשובות
    const responses = {};
    
    // אם יש אימייל מהמערכת, הוסף אותו
    if (respondentEmail) {
      responses['Email Address'] = respondentEmail;
    }
    
    for (var i = 0; i < itemResponses.length; i++) {
      var item = itemResponses[i];
      var question = item.getItem().getTitle();
      var answer = item.getResponse();
      responses[question] = answer;
    }
    
    Logger.log('Responses collected: ' + JSON.stringify(responses));
    
    // בניית הנתונים לשליחה לשרת
    const payload = buildPayload(responses);
    
    Logger.log('Payload built: ' + JSON.stringify(payload));
    
    // שליחה לשרת
    sendToServer(payload);
    
    Logger.log('✅ Successfully sent to server');
    
  } catch (error) {
    Logger.log('❌ Error in onFormSubmit: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
  }
}

// ===============================
// בניית המידע לפורמט של השרת
// ===============================

function buildPayload(responses) {
  // בניית כותרת אוטומטית מהנתונים
  const rooms = getFieldValue(responses, FIELD_MAPPING.rooms);
  const propertyType = getFieldValue(responses, FIELD_MAPPING.propertyType);
  const city = getFieldValue(responses, FIELD_MAPPING.city);
  
  let autoTitle = '';
  if (propertyType) autoTitle += propertyType + ' ';
  if (rooms) autoTitle += rooms + ' חדרים ';
  if (city) autoTitle += 'ב' + city;
  if (!autoTitle) autoTitle = 'יחידת דיור';
  
  // בניית כתובת מלאה
  const street = getFieldValue(responses, FIELD_MAPPING.street);
  const houseNumber = getFieldValue(responses, FIELD_MAPPING.houseNumber);
  const addressAddition = getFieldValue(responses, FIELD_MAPPING.addressAddition);
  
  let fullAddress = '';
  if (street) fullAddress += street;
  if (houseNumber) fullAddress += ' ' + houseNumber;
  if (addressAddition) fullAddress += ', ' + addressAddition;
  
  // אימייל - תמיכה בשתי דרכים (Email Address או כתובת אימייל)
  const email = getFieldValue(responses, FIELD_MAPPING.email) || 
                getFieldValue(responses, 'כתובת אימייל') ||
                getFieldValue(responses, 'אימייל') ||
                getFieldValue(responses, 'Email Address');
  
  // שם - עם fallback
  const name = getFieldValue(responses, FIELD_MAPPING.name) || 
               getFieldValue(responses, 'שם מלא') ||
               'משתמש';
  
  // וידוא שיש אימייל (שדה חובה!)
  if (!email) {
    throw new Error('חובה למלא כתובת אימייל! ודא שבטופס יש שאלה "Email Address" או הפעל "Collect email addresses" בהגדרות הטופס.');
  }
  
  // שדות בסיסיים
  const payload = {
    senderEmail: email,
    userName: name,
    userPhone: getFieldValue(responses, FIELD_MAPPING.phone),
    formType: FORM_TYPE,
    category: CATEGORY,
    title: autoTitle,
    description: getFieldValue(responses, FIELD_MAPPING.description) || '',
  };
  
  // עיר
  if (city) {
    payload.cityName = city;
  }
  
  // כתובת
  if (fullAddress) {
    payload.address = fullAddress;
  }
  
  // מחיר
  const price = getFieldValue(responses, FIELD_MAPPING.price);
  if (price) {
    const cleanPrice = price.toString().replace(/[^\d.]/g, '');
    payload.price = parseFloat(cleanPrice);
  }
  
  // שדות מותאמים אישית
  const customFields = {};
  
  // מספר מודעה (לעריכת מודעות קיימות)
  const adNumber = getFieldValue(responses, FIELD_MAPPING.adNumber);
  if (adNumber) {
    customFields.adNumber = adNumber;
  }
  
  // תיווך
  const broker = getFieldValue(responses, FIELD_MAPPING.broker);
  if (broker) {
    customFields.broker = broker;
  }
  
  // שכונה
  const neighborhood = getFieldValue(responses, FIELD_MAPPING.neighborhood);
  if (neighborhood) {
    customFields.neighborhood = neighborhood;
  }
  
  // רחוב, מספר בית ותוספת כתובת
  if (street) {
    customFields.street = street;
  }
  if (houseNumber) {
    customFields.houseNumber = houseNumber;
  }
  if (addressAddition) {
    customFields.addressAddition = addressAddition;
  }
  
  // סוג היחידה
  if (propertyType) {
    customFields.propertyType = propertyType;
  }
  
  // מספר חדרים
  if (rooms) {
    customFields.rooms = parseFloat(rooms.toString().replace(/[^\d.]/g, ''));
  }
  
  // שטח
  const squareMeters = getFieldValue(responses, FIELD_MAPPING.squareMeters);
  if (squareMeters) {
    customFields.squareMeters = parseFloat(squareMeters.toString().replace(/[^\d.]/g, ''));
  }
  
  // מצב הנכס
  const propertyCondition = getFieldValue(responses, FIELD_MAPPING.propertyCondition);
  if (propertyCondition) {
    customFields.condition = propertyCondition;  // שים לב: השדה נקרא 'condition' בממשק!
  }
  
  // קומה
  const floor = getFieldValue(responses, FIELD_MAPPING.floor);
  if (floor) {
    customFields.floor = floor;
  }
  
  // מרפסות
  const balconies = getFieldValue(responses, FIELD_MAPPING.balconies);
  if (balconies) {
    customFields.balconies = balconies;
  }
  
  // ריהוט
  const furniture = getFieldValue(responses, FIELD_MAPPING.furniture);
  if (furniture) {
    customFields.furniture = furniture;
  }
  
  // תאריך כניסה
  const entryDate = getFieldValue(responses, FIELD_MAPPING.entryDate);
  if (entryDate) {
    customFields.entryDate = entryDate;
  }
  
  // ארנונה
  const arnona = getFieldValue(responses, FIELD_MAPPING.arnona);
  if (arnona) {
    const cleanArnona = arnona.toString().replace(/[^\d.]/g, '');
    customFields.arnona = parseFloat(cleanArnona);
  }
  
  // וועד בית
  const vaadBayit = getFieldValue(responses, FIELD_MAPPING.vaadBayit);
  if (vaadBayit) {
    const cleanVaad = vaadBayit.toString().replace(/[^\d.]/g, '');
    customFields.vaadBayit = parseFloat(cleanVaad);
  }
  
  // מאפיינים (checkbox list) - מגיע כמערך או string מופרד בפסיקים
  const features = getFieldValue(responses, FIELD_MAPPING.features);
  if (features) {
    // יצירת אובייקט features מקונן - זה המבנה שהממשק מצפה לו!
    const featuresObj = {};
    
    // אם זה מערך - Google Forms מחזיר מערך עבור checkbox
    if (Array.isArray(features)) {
      // פיצול המאפיינים לשדות ספציפיים - שמות השדות חייבים להתאים לממשק!
      featuresObj.parking = features.includes('חניה') || features.includes('חנייה');
      featuresObj.storage = features.includes('מחסן');  // שים לב: storage ולא warehouse!
      featuresObj.safeRoom = features.includes('ממ"ד') || features.includes('ממד');  // safeRoom ולא mamad!
      featuresObj.sukkaBalcony = features.includes('מרפסת סוכה');
      featuresObj.elevator = features.includes('מעלית');
      featuresObj.view = features.includes('נוף');
      featuresObj.parentalUnit = features.includes('יחידת הורים');
      featuresObj.housingUnit = features.includes('יחידת דיור');
      featuresObj.yard = features.includes('חצר');
      featuresObj.airConditioning = features.includes('מיזוג');
      featuresObj.garden = features.includes('גינה');
      featuresObj.renovated = features.includes('חדית') || features.includes('משופץ');
      featuresObj.upgradedKitchen = features.includes('מטבח משודרג');
      featuresObj.accessibleForDisabled = features.includes('גישה לנכים') || features.includes('נגיש');
      featuresObj.hasOption = features.includes('אופציה');  // hasOption ולא option!
      featuresObj.frontFacing = features.includes('חזית');
      // שדות נוספים רלוונטיים ליחידת דיור
      featuresObj.privateEntrance = features.includes('כניסה פרטית') || features.includes('כניסה נפרדת');
      featuresObj.kitchenette = features.includes('מטבחון') || features.includes('פינת בישול');
    } else if (typeof features === 'string') {
      // אם זה string - פיצול לפי פסיקים
      const featuresArray = features.split(',').map(f => f.trim());
      
      featuresObj.parking = featuresArray.some(f => f.includes('חניה') || f.includes('חנייה'));
      featuresObj.storage = featuresArray.some(f => f.includes('מחסן'));
      featuresObj.safeRoom = featuresArray.some(f => f.includes('ממ"ד') || f.includes('ממד'));
      featuresObj.sukkaBalcony = featuresArray.some(f => f.includes('מרפסת סוכה'));
      featuresObj.elevator = featuresArray.some(f => f.includes('מעלית'));
      featuresObj.view = featuresArray.some(f => f.includes('נוף'));
      featuresObj.parentalUnit = featuresArray.some(f => f.includes('יחידת הורים'));
      featuresObj.housingUnit = featuresArray.some(f => f.includes('יחידת דיור'));
      featuresObj.yard = featuresArray.some(f => f.includes('חצר'));
      featuresObj.airConditioning = featuresArray.some(f => f.includes('מיזוג'));
      featuresObj.garden = featuresArray.some(f => f.includes('גינה'));
      featuresObj.renovated = featuresArray.some(f => f.includes('חדית') || f.includes('משופץ'));
      featuresObj.upgradedKitchen = featuresArray.some(f => f.includes('מטבח משודרג'));
      featuresObj.accessibleForDisabled = featuresArray.some(f => f.includes('גישה לנכים') || f.includes('נגיש'));
      featuresObj.hasOption = featuresArray.some(f => f.includes('אופציה'));
      featuresObj.frontFacing = featuresArray.some(f => f.includes('חזית'));
      featuresObj.privateEntrance = featuresArray.some(f => f.includes('כניסה פרטית') || f.includes('כניסה נפרדת'));
      featuresObj.kitchenette = featuresArray.some(f => f.includes('מטבחון') || f.includes('פינת בישול'));
    }
    
    // שמירת features כאובייקט מקונן - רק זה! בלי שדות נוספים בשורש
    customFields.features = featuresObj;
  }
  
  payload.customFields = customFields;
  
  return payload;
}

// ===============================
// פונקציות עזר
// ===============================

function getFieldValue(responses, fieldName) {
  if (!fieldName) return null;
  return responses[fieldName] || null;
}

function convertYesNo(value) {
  if (!value) return false;
  const str = value.toString().toLowerCase();
  return str === 'כן' || str === 'yes' || str === 'true' || str === '1';
}

function sendToServer(payload) {
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true  // כדי לראות שגיאות
  };
  
  var response = UrlFetchApp.fetch(SERVER_URL, options);
  var responseCode = response.getResponseCode();
  var responseText = response.getContentText();
  
  Logger.log('Server response code: ' + responseCode);
  Logger.log('Server response: ' + responseText);
  
  if (responseCode !== 200 && responseCode !== 201) {
    throw new Error('Server returned error: ' + responseCode + ' - ' + responseText);
  }
}

// ===============================
// פונקציה לבדיקה ידנית (אופציונלי)
// ===============================

function testSubmission() {
  // צור כאן נתוני דמה לבדיקה
  const testResponses = {
    'Email Address': 'test@example.com',  // Google Forms Collect email
    'שם': 'דוד ישראלי',
    'טלפון': '050-1234567',
    'תיאור היחידה': 'יחידת דיור מרווחת ומשופצת, כניסה פרטית, מטבחון מאובזר. מושלם עבור זוג צעיר או סטודנטים.',
    'עיר': 'ירושלים',
    'שכונה': 'רמות',
    'רחובות': 'דולב',
    'מספר בית': '25',
    'תוספת כתובת (לדוג: דירה 14, כניסה ב\')': 'יחידת דיור בחצר',
    'סוג היחידה': 'יחידת דיור נפרדת',
    'מספר חדרים': '2',
    'שטח במ"ר': '40',
    'מצב היחידה': 'משופץ',
    'קומה': 'קרקע',
    'מרפסות': '1',
    'ריהוט': 'ללא ריהוט',
    'תאריך כניסה': 'מיידי',
    'מחיר מבוקש': '2800',
    'ארנונה': '300',
    'וועד בית (לחודש)': '0',
    'תיווך ': 'פרטי',
    'מאפיינים': ['כניסה פרטית', 'מטבחון', 'מיזוג', 'חצר'],
    'שלח לי את הלוח השבועי באימייל לאחר הפרסום': 'כן',
  };
  
  try {
    const payload = buildPayload(testResponses);
    Logger.log('Test payload: ' + JSON.stringify(payload));
    sendToServer(payload);
    Logger.log('✅ Test successful!');
  } catch (error) {
    Logger.log('❌ Test failed: ' + error.toString());
  }
}
