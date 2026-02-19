/**
 * Google Forms Apps Script - אינטגרציה עם מערכת המקום (דרושה דירה לשבת)
 * 
 * הוראות התקנה:
 * 1. פתח את טופס דרושה דירה לשבת ב-Google Forms
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
const FORM_TYPE = 'wanted';  // 'publish' או 'wanted'
const CATEGORY = 'דירות לשבת';  // שם הקטגוריה (חייב להיות בדיוק כמו בבסיס הנתונים!)

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
  description: 'תיאור הדרוש',
  
  // שדות מיקום
  city: 'עיר',
  neighborhood: 'שכונה',
  street: 'רחוב',
  houseNumber: 'מספר בית',
  addressAddition: 'תוספת כתובת (לדוג: דירה 14, כניסה ב\')',
  
  // שדות ייחודיים לדירה לשבת
  isPaid: 'אירוח בתשלום',           // כן/לא או checkbox
  parasha: 'לאיזו שבת הדירה תהיה זמינה?',  // שבת פרשת...
  purpose: 'שימוש בדירה',            // אירוח מלא / לינה בלבד
  priceRequested: 'גובה התשלום',     // מחיר (אם בתשלום)
  numberOfBeds: 'מספר מיטות',        // מספר מיטות בדירה
  
  // פרטי הנכס
  propertyType: 'סוג הנכס',  // דירה, בית פרטי וכו'
  rooms: 'מספר חדרים',
  squareMeters: 'שטח במ"ר',
  propertyCondition: 'מצב הנכס',
  floor: 'קומה',
  balconies: 'מרפסות',
  furniture: 'ריהוט',
  entryDate: 'תאריך כניסה',
  broker: 'תיווך',
  
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
  const parasha = getFieldValue(responses, FIELD_MAPPING.parasha);
  
  let autoTitle = 'דרושה דירה לשבת ';
  if (parasha) autoTitle += 'פרשת ' + parasha + ' ';
  if (propertyType && propertyType !== 'דירה') autoTitle = 'דרושה ' + propertyType + ' לשבת ';
  if (rooms) autoTitle += rooms + ' חדרים ';
  if (city) autoTitle += 'ב' + city;
  
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
    title: autoTitle.trim(),
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
  
  // שדות מותאמים אישית
  const customFields = {};
  
  // מספר מודעה (לעריכת מודעות קיימות)
  const adNumber = getFieldValue(responses, FIELD_MAPPING.adNumber);
  if (adNumber) {
    customFields.adNumber = adNumber;
  }
  
  // שדות ייחודיים לדירה לשבת
  const isPaid = getFieldValue(responses, FIELD_MAPPING.isPaid);
  if (isPaid) {
    customFields.isPaid = convertYesNo(isPaid);
  }
  
  if (parasha) {
    customFields.parasha = parasha;
  }
  
  const purpose = getFieldValue(responses, FIELD_MAPPING.purpose);
  if (purpose) {
    customFields.purpose = purpose;
  }
  
  // מחיר (רק אם בתשלום)
  const priceRequested = getFieldValue(responses, FIELD_MAPPING.priceRequested);
  if (priceRequested) {
    const cleanPrice = priceRequested.toString().replace(/[^\d.]/g, '');
    if (cleanPrice) {
      payload.price = parseFloat(cleanPrice);
    }
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
  
  // סוג הנכס
  if (propertyType) {
    // מיפוי בין שמות עבריים לערכי ENUM
    let mappedType = propertyType;
    
    if (propertyType.includes('בית פרטי')) mappedType = 'PRIVATE_HOUSE';
    else if (propertyType.includes('דירת גן')) mappedType = 'GARDEN_APARTMENT';
    else if (propertyType.includes('דופלקס')) mappedType = 'DUPLEX';
    else if (propertyType.includes('דירה')) mappedType = 'APARTMENT';
    else if (propertyType.includes('פנטהאוז')) mappedType = 'PENTHOUSE';
    else if (propertyType.includes('סטודיו')) mappedType = 'STUDIO';
    else if (propertyType.includes('דו משפחתי')) mappedType = 'SEMI_DETACHED';
    else if (propertyType.includes('בניין מגורים')) mappedType = 'RESIDENTIAL_BUILDING';
    else if (propertyType.includes('דו קומתי')) mappedType = 'TWO_STORY';
    else if (propertyType.includes('מיני פנטהאוז')) mappedType = 'MINI_PENTHOUSE';
    
    customFields.propertyType = mappedType;
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
  
  // מספר מיטות
  const numberOfBeds = getFieldValue(responses, FIELD_MAPPING.numberOfBeds);
  if (numberOfBeds) {
    const bedsNum = parseFloat(numberOfBeds.toString().replace(/[^\d.]/g, ''));
    if (!isNaN(bedsNum)) {
      customFields.beds = bedsNum;  // המערכת מצפה לשדה 'beds'
    }
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
      featuresObj.shabbosClock = features.includes('שעון שבת');
      // מאפיינים ייחודיים לדירה לשבת
      featuresObj.plata = features.includes('פלטה');
      featuresObj.urn = features.includes('מיחם');
      featuresObj.linens = features.includes('מצעים');
      featuresObj.pool = features.includes('בריכה');
      featuresObj.kidsGames = features.includes('משחקי ילדים');
      featuresObj.babyBed = features.includes('מיטת תינוק');
      featuresObj.balcony = features.includes('מרפסת');
      featuresObj.sleepingOnly = features.includes('לינה בלבד');
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
      featuresObj.shabbosClock = featuresArray.some(f => f.includes('שעון שבת'));
      // מאפיינים ייחודיים לדירה לשבת
      featuresObj.plata = featuresArray.some(f => f.includes('פלטה'));
      featuresObj.urn = featuresArray.some(f => f.includes('מיחם'));
      featuresObj.linens = featuresArray.some(f => f.includes('מצעים'));
      featuresObj.pool = featuresArray.some(f => f.includes('בריכה'));
      featuresObj.kidsGames = featuresArray.some(f => f.includes('משחקי ילדים'));
      featuresObj.babyBed = featuresArray.some(f => f.includes('מיטת תינוק'));
      featuresObj.balcony = featuresArray.some(f => f.includes('מרפסת'));
      featuresObj.sleepingOnly = featuresArray.some(f => f.includes('לינה בלבד'));
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
    'שם': 'רחל אברהם',
    'טלפון': '053-1234567',
    'תיאור הדרוש': 'דרושה דירה לשבת פרשת ויצא, 4-5 אורחים. מעדיפים דירה מרוהטת עם חניה וקרוב לבית כנסת. אירוח מלא עדיף.',
    'עיר': 'ירושלים',
    'שכונה': 'רמות',
    'רחוב': '',
    'מספר בית': '',
    'תוספת כתובת (לדוג: דירה 14, כניסה ב\')': '',
    'אירוח בתשלום': 'כן',
    'לאיזו שבת הדירה תהיה זמינה?': 'ויצא',
    'שימוש בדירה': 'אירוח מלא',
    'גובה התשלום': '800',
    'מספר מיטות': '8',
    'סוג הנכס': 'דירה',
    'מספר חדרים': '4',
    'שטח במ"ר': '100',
    'מצב הנכס': 'לא משנה',
    'קומה': '1-3',
    'מרפסות': '1',
    'ריהוט': 'מרוהט',
    'תאריך כניסה': 'שבת',
    'תיווך': 'לא משנה',
    'מאפיינים': ['חניה', 'מעלית', 'מיזוג', 'פלטה', 'מיחם', 'מצעים'],
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
