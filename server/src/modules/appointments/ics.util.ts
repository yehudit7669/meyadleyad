/**
 * יצירת קובץ ICS (calendar invite) עבור פגישה
 */
export function generateICS(params: {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  uid: string;
}): string {
  const { title, description, location, startTime, endTime, uid } = params;

  // המרת תאריך לפורמט ICS (YYYYMMDDTHHmmssZ)
  const formatDate = (date: Date): string => {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MeYadLeYad//Appointments//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}@meyadleyad.co.il`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startTime)}`,
    `DTEND:${formatDate(endTime)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

/**
 * המרת ICS ל-base64 עבור data URL
 */
export function icsToDataUrl(icsContent: string): string {
  const base64 = Buffer.from(icsContent).toString('base64');
  return `data:text/calendar;base64,${base64}`;
}
