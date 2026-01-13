# Service Provider Registration - Test Payload Examples

## דוגמת Payload למתווך (Broker)

```json
{
  "serviceProviderType": "BROKER",
  "firstName": "יוסי",
  "lastName": "כהן",
  "phonePersonal": "050-1234567",
  "email": "yossi.broker@example.com",
  "password": "securePass123",
  "businessName": "משרד תיווך כהן",
  "businessAddress": "רחוב הרב קוק 15, בית שמש",
  "businessPhone": "02-9991234",
  "website": "https://www.cohen-realestate.co.il",
  "brokerLicenseNumber": "12345678",
  "brokerCityId": "beit-shemesh",
  "weeklyDigestOptIn": true,
  "termsAccepted": true,
  "declarationAccepted": true
}
```

## דוגמת Payload לעורך דין (Lawyer)

```json
{
  "serviceProviderType": "LAWYER",
  "firstName": "שרה",
  "lastName": "לוי",
  "phonePersonal": "054-9876543",
  "email": "sarah.lawyer@example.com",
  "password": "securePass456",
  "businessName": "משרד עו\"ד לוי ושות'",
  "businessAddress": "רחוב האומנים 8, בית שמש",
  "businessPhone": "02-5551234",
  "website": "https://www.levylaw.co.il",
  "weeklyDigestOptIn": false,
  "termsAccepted": true,
  "declarationAccepted": true
}
```

## דוגמת Payload לשמאי (Appraiser)

```json
{
  "serviceProviderType": "APPRAISER",
  "firstName": "דוד",
  "lastName": "מזרחי",
  "phonePersonal": "052-1112233",
  "email": "david.appraiser@example.com",
  "password": "securePass789",
  "businessName": "שמאות מזרחי",
  "businessAddress": "רחוב נחל שורק 22, בית שמש",
  "businessPhone": "",
  "website": "",
  "weeklyDigestOptIn": true,
  "termsAccepted": true,
  "declarationAccepted": true
}
```

## דוגמת Payload למעצב פנים / אדריכל (Designer/Architect)

```json
{
  "serviceProviderType": "DESIGNER_ARCHITECT",
  "firstName": "מיכל",
  "lastName": "אברהם",
  "phonePersonal": "050-7778899",
  "email": "michal.designer@example.com",
  "password": "designPass123",
  "businessName": "סטודיו אברהם לעיצוב פנים",
  "businessAddress": "רחוב הפסגה 5, בית שמש",
  "businessPhone": "02-6667788",
  "website": "https://www.avraham-design.co.il",
  "weeklyDigestOptIn": true,
  "termsAccepted": true,
  "declarationAccepted": true
}
```

## דוגמת Payload ליועץ משכנתאות (Mortgage Advisor)

```json
{
  "serviceProviderType": "MORTGAGE_ADVISOR",
  "firstName": "אבי",
  "lastName": "גולן",
  "phonePersonal": "053-4445566",
  "email": "avi.mortgage@example.com",
  "password": "mortgagePass456",
  "businessName": "ייעוץ משכנתאות גולן",
  "businessAddress": "רחוב הנשיא 10, בית שמש",
  "businessPhone": "02-3334455",
  "website": "https://www.golan-mortgage.co.il",
  "weeklyDigestOptIn": true,
  "termsAccepted": true,
  "declarationAccepted": true
}
```

## בדיקה עם cURL

### הרשמת מתווך
```bash
curl -X POST http://localhost:5001/api/auth/register-service-provider \
  -H "Content-Type: application/json" \
  -d '{
    "serviceProviderType": "BROKER",
    "firstName": "יוסי",
    "lastName": "כהן",
    "phonePersonal": "050-1234567",
    "email": "test.broker@example.com",
    "password": "test123456",
    "businessName": "משרד תיווך כהן",
    "businessAddress": "רחוב הרב קוק 15, בית שמש",
    "businessPhone": "02-9991234",
    "website": "https://www.test.co.il",
    "brokerLicenseNumber": "12345678",
    "brokerCityId": "beit-shemesh",
    "weeklyDigestOptIn": true,
    "termsAccepted": true,
    "declarationAccepted": true
  }'
```

### הרשמת עורך דין
```bash
curl -X POST http://localhost:5001/api/auth/register-service-provider \
  -H "Content-Type: application/json" \
  -d '{
    "serviceProviderType": "LAWYER",
    "firstName": "שרה",
    "lastName": "לוי",
    "phonePersonal": "054-9876543",
    "email": "test.lawyer@example.com",
    "password": "test123456",
    "businessName": "משרד עו\"ד לוי",
    "businessAddress": "רחוב האומנים 8, בית שמש",
    "weeklyDigestOptIn": false,
    "termsAccepted": true,
    "declarationAccepted": true
  }'
```

## Validation Errors - דוגמאות לשגיאות

### חסר serviceProviderType
```json
{
  "error": "Service provider type is required"
}
```

### חסר firstName או lastName
```json
{
  "error": "First name must be at least 2 characters"
}
```

### מתווך ללא מספר רישיון
```json
{
  "error": "Broker license number and city are required for brokers"
}
```

### אימייל קיים
```json
{
  "error": "Email already registered"
}
```

## תשובה מוצלחת (Success Response)

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "yossi.broker@example.com",
      "firstName": "יוסי",
      "lastName": "כהן",
      "name": "יוסי כהן",
      "role": "BROKER",
      "userType": "SERVICE_PROVIDER",
      "serviceProviderType": "BROKER",
      "businessName": "משרד תיווך כהן",
      "phonePersonal": "050-1234567",
      "isAdmin": false,
      "isBroker": true,
      "isServiceProvider": true
    },
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  }
}
```
