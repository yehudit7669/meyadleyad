/**
 * Google Forms Apps Script - אינטגרציה עם מערכת המקום (הרשמה למערכת)
 * 
 * הוראות התקנה:
 * 1. פתח את טופס ההרשמה ב-Google Forms
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
const FORM_TYPE = 'registration';  // זיהוי מיוחד לטופס הרשמה
const CATEGORY = 'הרשמה';  // שם הקטגוריה

// ===============================
// מיפוי שדות הטופס לשדות המערכת
// ===============================
// ערוך את השמות בצד ימין לפי שמות השאלות בטופס שלך

const FIELD_MAPPING = {
  // שדות חובה
  email: 'מהי הכתובת אימייל שלך ?',
  name: 'שם',
  password: 'סיסמה',
  passwordConfirm: 'אימות סיסמה',
  
  // שדות נוספים
  phone: 'טלפון',
  city: 'עיר',
  agreeToTerms: 'אשר את מדיניות הפרטיות',
  weeklyDigestOptIn: 'רוצה לקבל את הגיליון השבועי של "המקום" עם כל הדירות במקום אחד ?',
};

// ===============================
// הפונקציה שרצה כש-Trigger מופעל
// ===============================

function onFormSubmit(e) {
  try {
    Logger.log('📝 Registration form submitted, processing...');
    
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
  // אימייל - תמיכה בשתי דרכים
  const email = getFieldValue(responses, FIELD_MAPPING.email) || 
                getFieldValue(responses, 'כתובת אימייל') ||
                getFieldValue(responses, 'אימייל') ||
                getFieldValue(responses, 'Email Address');
  
  // שם
  const name = getFieldValue(responses, FIELD_MAPPING.name) || 
               getFieldValue(responses, 'שם') ||
               'משתמש';
  
  // סיסמה וסיסמה לאישור
  const password = getFieldValue(responses, FIELD_MAPPING.password);
  const passwordConfirm = getFieldValue(responses, FIELD_MAPPING.passwordConfirm);
  
  // טלפון
  const phone = getFieldValue(responses, FIELD_MAPPING.phone);
  
  // וידוא שיש אימייל (שדה חובה!)
  if (!email) {
    throw new Error('חובה למלא כתובת אימייל! ודא שבטופס יש שאלה "מהי הכתובת אימייל שלך ?" או הפעל "Collect email addresses" בהגדרות הטופס.');
  }
  
  // וידוא שיש סיסמה
  if (!password) {
    throw new Error('חובה למלא סיסמה!');
  }
  
  // שדות בסיסיים
  const payload = {
    senderEmail: email,
    userName: name,
    userPhone: phone,
    formType: FORM_TYPE,
    category: CATEGORY,
    title: 'הרשמה למערכת המקום',
    description: `הרשמה חדשה: ${name}`,
  };
  
  // שדות מותאמים אישית
  const customFields = {};
  
  // סיסמה (שדה חובה עבור הרשמה)
  if (password) {
    customFields.password = password;
  }
  
  // אישור סיסמה
  if (passwordConfirm) {
    customFields.passwordConfirm = passwordConfirm;
  }
  
  // עיר
  const city = getFieldValue(responses, FIELD_MAPPING.city);
  if (city) {
    customFields.city = city;
  }
  
  // הסכמה לתנאים
  const agreeToTerms = getFieldValue(responses, FIELD_MAPPING.agreeToTerms);
  if (agreeToTerms) {
    customFields.agreeToTerms = convertYesNo(agreeToTerms);
  }
  
  // רישום ללוח שבועי
  const weeklyDigestOptIn = getFieldValue(responses, FIELD_MAPPING.weeklyDigestOptIn);
  if (weeklyDigestOptIn) {
    customFields.weeklyDigestOptIn = convertYesNo(weeklyDigestOptIn);
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
    'מהי הכתובת אימייל שלך ?': 'test@example.com',
    'שם': 'דוד כהן',
    'סיסמה': 'Test123456',
    'אימות סיסמה': 'Test123456',
    'טלפון': '050-1234567',
    'עיר': 'ירושלים',
    'אשר את מדיניות הפרטיות': 'כן',
    'רוצה לקבל את הגיליון השבועי של "המקום" עם כל הדירות במקום אחד ?': 'כן',
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
