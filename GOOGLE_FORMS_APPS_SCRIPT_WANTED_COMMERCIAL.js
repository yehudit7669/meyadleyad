/**
 * Google Forms Apps Script - אינטגרציה עם מערכת המקום (דרושים - נדל"ן מסחרי)
 * 
 * הוראות התקנה:
 * 1. פתח את טופס דרושים - נדל"ן מסחרי ב-Google Forms
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
const CATEGORY = 'שטחים מסחריים';  // שם הקטגוריה (חייב להיות בדיוק כמו בבסיס הנתונים!)

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
  addressAddition: 'תוספת כתובת (לדוג: דירה 14, כניסה ב\')',
  
  // מחיר
  price: 'מחיר מבוקש',
  arnona: 'ארנונה',
  vaadBayit: 'וועד בית (לחודש)',
  
  // פרטי הנכס המסחרי
  propertyType: 'סוג הנכס',  // חנות, משרד, מחסן וכו'
  squareMeters: 'שטח במ"ר',
  floor: 'קומה',
  furniture: 'ריהוט',
  entryDate: 'תאריך כניסה',
  
  // שדות ייחודיים לנדל"ן מסחרי
  transactionType: 'ציון לאיזה מטרה אתם אתם צריכים להשכרה או למכירה?',  // השכרה או למכירה
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
  const propertyType = getFieldValue(responses, FIELD_MAPPING.propertyType);
  const squareMeters = getFieldValue(responses, FIELD_MAPPING.squareMeters);
  const city = getFieldValue(responses, FIELD_MAPPING.city);
  const transactionType = getFieldValue(responses, FIELD_MAPPING.transactionType);
  
  let autoTitle = 'דרוש ';
  if (propertyType) autoTitle += propertyType + ' ';
  if (squareMeters) autoTitle += squareMeters + ' מ"ר ';
  if (transactionType && transactionType.includes('השכרה')) autoTitle += 'להשכרה ';
  else if (transactionType && transactionType.includes('מכירה')) autoTitle += 'לקנייה ';
  if (city) autoTitle += 'ב' + city;
  if (autoTitle === 'דרוש ') autoTitle = 'דרוש נכס מסחרי';
  
  // בניית כתובת מלאה
  const street = getFieldValue(responses, FIELD_MAPPING.street);
  const addressAddition = getFieldValue(responses, FIELD_MAPPING.addressAddition);
  
  let fullAddress = '';
  if (street) fullAddress += street;
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
  
  // סוג עסקה (השכרה/מכירה)
  if (transactionType) {
    if (transactionType.includes('השכרה') || transactionType.toLowerCase().includes('rent')) {
      customFields.transactionType = 'השכרה';
    } else if (transactionType.includes('מכירה') || transactionType.toLowerCase().includes('sale')) {
      customFields.transactionType = 'מכירה';
    } else {
      customFields.transactionType = transactionType;
    }
  }
  
  // תיווך
  const broker = getFieldValue(responses, FIELD_MAPPING.broker);
  if (broker) {
    if (broker.includes('ללא') || broker.includes('פרטי')) {
      customFields.broker = 'ללא תיווך';
    } else if (broker.includes('עם') || broker.includes('מתווך')) {
      customFields.broker = 'עם תיווך';
    } else {
      customFields.broker = broker;
    }
  }
  
  // שכונה
  const neighborhood = getFieldValue(responses, FIELD_MAPPING.neighborhood);
  if (neighborhood) {
    customFields.neighborhood = neighborhood;
  }
  
  // רחוב ותוספת כתובת
  if (street) {
    customFields.street = street;
  }
  if (addressAddition) {
    customFields.addressAddition = addressAddition;
  }
  
  // סוג הנכס המסחרי
  if (propertyType) {
    // מיפוי בין שמות עבריים לערכי ENUM
    let mappedType = propertyType;
    
    // מיפוי סוגי נכס מסחרי
    if (propertyType.includes('חנות')) mappedType = 'STORE';
    else if (propertyType.includes('קליניקה')) mappedType = 'CLINIC';
    else if (propertyType.includes('מחסן')) mappedType = 'WAREHOUSE';
    else if (propertyType.includes('גלריה')) mappedType = 'GALLERY';
    else if (propertyType.includes('משרד')) mappedType = 'OFFICE';
    else if (propertyType.includes('שטח תפעולי')) mappedType = 'OPERATIONAL_SPACE';
    else if (propertyType.includes('האנגר') || propertyType.includes('הנגר')) mappedType = 'HANGAR';
    else if (propertyType.includes('אולם תצוגה')) mappedType = 'SHOWROOM';
    
    customFields.propertyType = mappedType;
  }
  
  // שטח
  if (squareMeters) {
    customFields.squareMeters = parseFloat(squareMeters.toString().replace(/[^\d.]/g, ''));
  }
  
  // קומה
  const floor = getFieldValue(responses, FIELD_MAPPING.floor);
  if (floor) {
    customFields.floor = floor;
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
  
  // מאפיינים מסחריים (checkbox list) - מגיע כמערך או string מופרד בפסיקים
  const features = getFieldValue(responses, FIELD_MAPPING.features);
  if (features) {
    // יצירת אובייקט features מקונן - זה המבנה שהממשק מצפה לו!
    const featuresObj = {};
    
    // אם זה מערך - Google Forms מחזיר מערך עבור checkbox
    if (Array.isArray(features)) {
      // מאפיינים ספציפיים לנכס מסחרי
      featuresObj.parking = features.includes('חניה') || features.includes('חנייה');
      featuresObj.warehouse = features.includes('מחסן');
      featuresObj.gallery = features.includes('גלריה');
      featuresObj.airConditioning = features.includes('מיזוג');
      featuresObj.kitchenette = features.includes('מטבחון') || features.includes('פינת בישול');
      featuresObj.mamad = features.includes('ממ"ד') || features.includes('ממד');
      featuresObj.restrooms = features.includes('שירותים') || features.includes('WC');
      featuresObj.yard = features.includes('חצר');
      featuresObj.elevator = features.includes('מעלית');
      featuresObj.accessibility = features.includes('נגישות') || features.includes('גישה לנכים');
      featuresObj.streetDisplay = features.includes('חלון ראווה') || features.includes('ויטרינה') || features.includes('חזית לרחוב');
      featuresObj.internet = features.includes('אינטרנט') || features.includes('אינטרנט מהיר');
      featuresObj.renovated = features.includes('חדית') || features.includes('משופץ');
    } else if (typeof features === 'string') {
      // אם זה string - פיצול לפי פסיקים
      const featuresArray = features.split(',').map(f => f.trim());
      
      featuresObj.parking = featuresArray.some(f => f.includes('חניה') || f.includes('חנייה'));
      featuresObj.warehouse = featuresArray.some(f => f.includes('מחסן'));
      featuresObj.gallery = featuresArray.some(f => f.includes('גלריה'));
      featuresObj.airConditioning = featuresArray.some(f => f.includes('מיזוג'));
      featuresObj.kitchenette = featuresArray.some(f => f.includes('מטבחון') || f.includes('פינת בישול'));
      featuresObj.mamad = featuresArray.some(f => f.includes('ממ"ד') || f.includes('ממד'));
      featuresObj.restrooms = featuresArray.some(f => f.includes('שירותים') || f.includes('WC'));
      featuresObj.yard = featuresArray.some(f => f.includes('חצר'));
      featuresObj.elevator = featuresArray.some(f => f.includes('מעלית'));
      featuresObj.accessibility = featuresArray.some(f => f.includes('נגישות') || f.includes('גישה לנכים'));
      featuresObj.streetDisplay = featuresArray.some(f => f.includes('חלון ראווה') || f.includes('ויטרינה') || f.includes('חזית לרחוב'));
      featuresObj.internet = featuresArray.some(f => f.includes('אינטרנט') || f.includes('אינטרנט מהיר'));
      featuresObj.renovated = featuresArray.some(f => f.includes('חדית') || f.includes('משופץ'));
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
    'תיאור הדרוש': 'דרוש משרד מרווח בתל אביב, מינימום 50 מ"ר, עם חניה ומיזוג. תקציב עד 7000 ש"ח לחודש. מעדיפים אזור מרכז העיר או צפון תל אביב.',
    'עיר': 'תל אביב',
    'שכונה': 'מרכז העיר',
    'רחוב': '',
    'תוספת כתובת (לדוג: דירה 14, כניסה ב\')': '',
    'סוג הנכס': 'משרד',
    'שטח במ"ר': '50-70',
    'קומה': '1-3',
    'ריהוט': 'לא משנה',
    'תאריך כניסה': 'גמיש',
    'מחיר מבוקש': '7000',
    'ארנונה': '',
    'וועד בית (לחודש)': '',
    'ציון לאיזה מטרה אתם אתם צריכים להשכרה או למכירה?': 'להשכרה',
    'תיווך ': 'לא משנה',
    'מאפיינים': ['מיזוג', 'חניה', 'אינטרנט'],
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
