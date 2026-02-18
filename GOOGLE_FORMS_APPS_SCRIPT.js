/**
 * Google Forms Apps Script - אינטגרציה עם מערכת המקום
 * 
 * הוראות התקנה:
 * 1. פתח את הטופס ב-Google Forms
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
const CATEGORY = 'דירות למכירה';  // שם הקטגוריה

// ===============================
// מיפוי שדות הטופס לשדות המערכת
// ===============================
// ערוך את השמות בצד ימין לפי שמות השאלות בטופס שלך

const FIELD_MAPPING = {
  // שדות חובה
  email: 'כתובת אימייל',           // שם השאלה בטופס
  name: 'שם מלא',                  // שם השאלה בטופס
  phone: 'מספר טלפון',             // שם השאלה בטופס
  title: 'כותרת המודעה',           // שם השאלה בטופס
  description: 'תיאור הנכס',       // שם השאלה בטופס
  
  // שדות אופציונליים
  price: 'מחיר',                   // שם השאלה בטופס
  city: 'עיר',                     // שם השאלה בטופס
  address: 'רחוב ומספר בית',       // שם השאלה בטופס
  
  // שדות מותאמים אישית (customFields)
  rooms: 'מספר חדרים',             // שם השאלה בטופס
  squareMeters: 'שטח במ״ר',       // שם השאלה בטופס
  floor: 'קומה',                   // שם השאלה בטופס
  parking: 'חניה',                 // שם השאלה בטופס
  elevator: 'מעלית',               // שם השאלה בטופס
  balcony: 'מרפסת',                // שם השאלה בטופס
  warehouse: 'מחסן',               // שם השאלה בטופס
  propertyCondition: 'מצב הנכס',   // שם השאלה בטופס
  entryDate: 'תאריך כניסה',        // שם השאלה בטופס
};

// ===============================
// הפונקציה שרצה כש-Trigger מופעל
// ===============================

function onFormSubmit(e) {
  try {
    Logger.log('📝 Form submitted, processing...');
    
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    
    // יצירת אובייקט עם כל התשובות
    const responses = {};
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
  // שדות בסיסיים
  const payload = {
    senderEmail: getFieldValue(responses, FIELD_MAPPING.email),
    userName: getFieldValue(responses, FIELD_MAPPING.name),
    userPhone: getFieldValue(responses, FIELD_MAPPING.phone),
    formType: FORM_TYPE,
    category: CATEGORY,
    title: getFieldValue(responses, FIELD_MAPPING.title),
    description: getFieldValue(responses, FIELD_MAPPING.description),
  };
  
  // שדות אופציונליים
  const price = getFieldValue(responses, FIELD_MAPPING.price);
  if (price) {
    // ניקוי המחיר מסימנים (₪, запятые וכו')
    const cleanPrice = price.toString().replace(/[^\d.]/g, '');
    payload.price = parseFloat(cleanPrice);
  }
  
  const city = getFieldValue(responses, FIELD_MAPPING.city);
  if (city) {
    payload.cityName = city;
  }
  
  const address = getFieldValue(responses, FIELD_MAPPING.address);
  if (address) {
    payload.address = address;
  }
  
  // שדות מותאמים אישית
  const customFields = {};
  
  const rooms = getFieldValue(responses, FIELD_MAPPING.rooms);
  if (rooms) {
    customFields.rooms = parseFloat(rooms.toString().replace(/[^\d.]/g, ''));
  }
  
  const squareMeters = getFieldValue(responses, FIELD_MAPPING.squareMeters);
  if (squareMeters) {
    customFields.squareMeters = parseFloat(squareMeters.toString().replace(/[^\d.]/g, ''));
  }
  
  const floor = getFieldValue(responses, FIELD_MAPPING.floor);
  if (floor) {
    customFields.floor = floor;
  }
  
  const parking = getFieldValue(responses, FIELD_MAPPING.parking);
  if (parking) {
    customFields.parking = convertYesNo(parking);
  }
  
  const elevator = getFieldValue(responses, FIELD_MAPPING.elevator);
  if (elevator) {
    customFields.elevator = convertYesNo(elevator);
  }
  
  const balcony = getFieldValue(responses, FIELD_MAPPING.balcony);
  if (balcony) {
    customFields.balcony = convertYesNo(balcony);
  }
  
  const warehouse = getFieldValue(responses, FIELD_MAPPING.warehouse);
  if (warehouse) {
    customFields.warehouse = convertYesNo(warehouse);
  }
  
  const propertyCondition = getFieldValue(responses, FIELD_MAPPING.propertyCondition);
  if (propertyCondition) {
    customFields.propertyCondition = propertyCondition;
  }
  
  const entryDate = getFieldValue(responses, FIELD_MAPPING.entryDate);
  if (entryDate) {
    customFields.entryDate = entryDate;
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
    'כתובת אימייל': 'test@example.com',
    'שם מלא': 'יוסי כהן',
    'מספר טלפון': '050-1234567',
    'כותרת המודעה': 'דירת 4 חדרים מרווחת',
    'תיאור הנכס': 'דירה מרווחת ומשופצת עם נוף פתוח',
    'מחיר': '1500000',
    'עיר': 'ירושלים',
    'רחוב ומספר בית': 'הרב קוק 15',
    'מספר חדרים': '4',
    'שטח במ״ר': '95',
    'קומה': '3',
    'חניה': 'כן',
    'מעלית': 'כן',
    'מרפסת': 'כן',
    'מחסן': 'לא',
    'מצב הנכס': 'משופץ',
    'תאריך כניסה': 'מיידי',
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
