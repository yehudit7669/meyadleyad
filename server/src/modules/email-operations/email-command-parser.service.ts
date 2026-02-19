/**
 * Email Command Parser Service
 * ניתוח פקודות מאימיילים נכנסים לפי שורת נושא בלבד + fallback
 * 
 * חוקי ניתוח:
 * 1. ניתוח ראשוני: שורת הנושא (Subject) בלבד
 * 2. Fallback: אם לא זוהה, בדיקת 5 השורות הראשונות של גוף ההודעה
 * 3. חיפוש פורמט תקני בלבד: "פעולה#מספר_מודעה" או "פעולה"
 */

export enum EmailCommandType {
  PUBLISH_SALE = 'PUBLISH_SALE',              // פרסום דירה למכירה
  PUBLISH_RENT = 'PUBLISH_RENT',              // פרסום דירה להשכרה
  PUBLISH_SHABBAT = 'PUBLISH_SHABBAT',        // פרסום דירה לשבת
  PUBLISH_HOUSING_UNIT = 'PUBLISH_HOUSING_UNIT', // פרסום יחידת דיור
  PUBLISH_COMMERCIAL = 'PUBLISH_COMMERCIAL',  // פרסום נדל"ן מסחרי
  PUBLISH_SHARED_OWNERSHIP = 'PUBLISH_SHARED_OWNERSHIP', // פרסום טאבו משותף
  WANTED_BUY = 'WANTED_BUY',                  // דרושה דירה לקנייה
  WANTED_RENT = 'WANTED_RENT',                // דרושה דירה להשכרה
  WANTED_SHABBAT = 'WANTED_SHABBAT',          // דרושה דירה לשבת
  WANTED_COMMERCIAL = 'WANTED_COMMERCIAL',    // דרושים - נדל"ן מסחרי
  WANTED_SHARED_OWNERSHIP = 'WANTED_SHARED_OWNERSHIP', // דרושים - טאבו משותף
  UPDATE_AD = 'UPDATE_AD',                    // עדכון#<adId>
  REMOVE_AD = 'REMOVE_AD',                    // הסרה#<adId>
  MAILING_LIST_SUBSCRIBE = 'MAILING_LIST_SUBSCRIBE',       // הצטרפות
  MAILING_LIST_UNSUBSCRIBE = 'MAILING_LIST_UNSUBSCRIBE',   // הסרה-תפוצה
  REGISTRATION = 'REGISTRATION',              // הרשמה
  UNKNOWN = 'UNKNOWN',                        // לא זוהה
}

export interface ParsedEmailCommand {
  commandType: EmailCommandType;
  adId?: string;              // רק לעדכון/הסרה
  confidence: 'high' | 'medium' | 'low';
  source: 'subject' | 'body-fallback';
  rawText: string;
}

export class EmailCommandParser {
  // מיפוי פקודות לפי שורת נושא
  private readonly COMMAND_PATTERNS = [
    // פרסום
    {
      regex: /^פרסום\s+דירה\s+למכירה\s*$/i,
      command: EmailCommandType.PUBLISH_SALE,
    },
    {
      regex: /^פרסום\s+דירה\s+להשכרה\s*$/i,
      command: EmailCommandType.PUBLISH_RENT,
    },
    {
      regex: /^פרסום\s+דירה\s+לשבת\s*$/i,
      command: EmailCommandType.PUBLISH_SHABBAT,
    },
    {
      regex: /^פרסום\s+יחידת\s+דיור\s*$/i,
      command: EmailCommandType.PUBLISH_HOUSING_UNIT,
    },
    {
      regex: /^פרסום\s+(שטח\s+מסחרי|נדל"ן\s+מסחרי)\s*$/i,
      command: EmailCommandType.PUBLISH_COMMERCIAL,
    },
    {
      regex: /^פרסום\s+טאבו\s+משותף\s*$/i,
      command: EmailCommandType.PUBLISH_SHARED_OWNERSHIP,
    },
    // דרוש
    {
      regex: /^דרושה\s+דירה\s+לקנייה\s*$/i,
      command: EmailCommandType.WANTED_BUY,
    },
    {
      regex: /^דרושה\s+דירה\s+להשכרה\s*$/i,
      command: EmailCommandType.WANTED_RENT,
    },
    {
      regex: /^דרושה\s+דירה\s+לשבת\s*$/i,
      command: EmailCommandType.WANTED_SHABBAT,
    },
    {
      regex: /^דרושים\s+-?\s*(שטח\s+מסחרי|נדל"ן\s+מסחרי)\s*$/i,
      command: EmailCommandType.WANTED_COMMERCIAL,
    },
    {
      regex: /^דרושים\s+-?\s*טאבו\s+משותף\s*$/i,
      command: EmailCommandType.WANTED_SHARED_OWNERSHIP,
    },
    // עדכון/הסרה עם מספר מודעה
    {
      regex: /^עדכון#(\d+)\s*$/i,
      command: EmailCommandType.UPDATE_AD,
      extractAdId: true,
    },
    {
      regex: /^הסרה#(\d+)\s*$/i,
      command: EmailCommandType.REMOVE_AD,
      extractAdId: true,
    },
    // רשימת תפוצה
    {
      regex: /^הצטרפות\s*$/i,
      command: EmailCommandType.MAILING_LIST_SUBSCRIBE,
    },
    {
      regex: /^הסרה-תפוצה\s*$/i,
      command: EmailCommandType.MAILING_LIST_UNSUBSCRIBE,
    },
    // הרשמה
    {
      regex: /^הרשמה\s*$/i,
      command: EmailCommandType.REGISTRATION,
    },
  ];

  /**
   * ניתוח פקודה מאימייל
   * @param subject שורת נושא
   * @param bodyText גוף ההודעה (text/plain)
   * @returns פקודה מנותחת
   */
  parseCommand(subject: string, bodyText?: string): ParsedEmailCommand {
    // שלב 1: ניתוח שורת נושא
    const subjectResult = this.parseFromText(subject.trim(), 'subject');
    if (subjectResult.commandType !== EmailCommandType.UNKNOWN) {
      return subjectResult;
    }

    // שלב 2: Fallback - 5 השורות הראשונות של גוף ההודעה
    if (bodyText) {
      const first5Lines = this.extractFirst5Lines(bodyText);
      for (const line of first5Lines) {
        const bodyResult = this.parseFromText(line.trim(), 'body-fallback');
        if (bodyResult.commandType !== EmailCommandType.UNKNOWN) {
          return {
            ...bodyResult,
            confidence: 'medium', // נמוך יותר כי לא מה-subject
          };
        }
      }
    }

    // לא זוהה
    return {
      commandType: EmailCommandType.UNKNOWN,
      confidence: 'low',
      source: 'subject',
      rawText: subject,
    };
  }

  /**
   * ניתוח טקסט בודד לפי הפטרנים
   */
  private parseFromText(
    text: string,
    source: 'subject' | 'body-fallback'
  ): ParsedEmailCommand {
    for (const pattern of this.COMMAND_PATTERNS) {
      const match = text.match(pattern.regex);
      if (match) {
        const result: ParsedEmailCommand = {
          commandType: pattern.command,
          confidence: source === 'subject' ? 'high' : 'medium',
          source,
          rawText: text,
        };

        // אם יש extractAdId, נחלץ את מספר המודעה
        if (pattern.extractAdId && match[1]) {
          result.adId = match[1];
        }

        return result;
      }
    }

    return {
      commandType: EmailCommandType.UNKNOWN,
      confidence: 'low',
      source,
      rawText: text,
    };
  }

  /**
   * חילוץ 5 השורות הראשונות מגוף ההודעה
   */
  private extractFirst5Lines(bodyText: string): string[] {
    const lines = bodyText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    return lines.slice(0, 5);
  }

  /**
   * בדיקה האם הפקודה דורשת משתמש רשום
   */
  isAuthRequired(commandType: EmailCommandType): boolean {
    const requiresAuth = [
      EmailCommandType.UPDATE_AD,
      EmailCommandType.REMOVE_AD,
    ];
    return requiresAuth.includes(commandType);
  }

  /**
   * בדיקה האם הפקודה דורשת מספר מודעה
   */
  requiresAdId(commandType: EmailCommandType): boolean {
    const needsAdId = [EmailCommandType.UPDATE_AD, EmailCommandType.REMOVE_AD];
    return needsAdId.includes(commandType);
  }

  /**
   * קבלת תיאור ידידותי לפקודה
   */
  getCommandDisplayName(commandType: EmailCommandType): string {
    const displayNames: Record<EmailCommandType, string> = {
      [EmailCommandType.PUBLISH_SALE]: 'פרסום דירה למכירה',
      [EmailCommandType.PUBLISH_RENT]: 'פרסום דירה להשכרה',
      [EmailCommandType.PUBLISH_SHABBAT]: 'פרסום דירה לשבת',
      [EmailCommandType.PUBLISH_HOUSING_UNIT]: 'פרסום יחידת דיור',
      [EmailCommandType.PUBLISH_COMMERCIAL]: 'פרסום נדל"ן מסחרי',
      [EmailCommandType.PUBLISH_SHARED_OWNERSHIP]: 'פרסום טאבו משותף',
      [EmailCommandType.WANTED_BUY]: 'דרושה דירה לקנייה',
      [EmailCommandType.WANTED_RENT]: 'דרושה דירה להשכרה',
      [EmailCommandType.WANTED_SHABBAT]: 'דרושה דירה לשבת',
      [EmailCommandType.WANTED_COMMERCIAL]: 'דרושים - נדל"ן מסחרי',
      [EmailCommandType.WANTED_SHARED_OWNERSHIP]: 'דרושים - טאבו משותף',
      [EmailCommandType.UPDATE_AD]: 'עדכון מודעה',
      [EmailCommandType.REMOVE_AD]: 'הסרת מודעה',
      [EmailCommandType.MAILING_LIST_SUBSCRIBE]: 'הצטרפות לרשימת תפוצה',
      [EmailCommandType.MAILING_LIST_UNSUBSCRIBE]: 'הסרה מרשימת תפוצה',
      [EmailCommandType.REGISTRATION]: 'הרשמה למערכת',
      [EmailCommandType.UNKNOWN]: 'פקודה לא מזוהה',
    };
    return displayNames[commandType] || 'לא ידוע';
  }

  /**
   * קבלת קטגוריה עבור מודעה לפי commandType
   */
  getCategoryForCommand(commandType: EmailCommandType): string | null {
    const categoryMap: Partial<Record<EmailCommandType, string>> = {
      [EmailCommandType.PUBLISH_SALE]: 'דירות למכירה',
      [EmailCommandType.PUBLISH_RENT]: 'דירות להשכרה',
      [EmailCommandType.PUBLISH_SHABBAT]: 'דירות לשבת',
      [EmailCommandType.PUBLISH_HOUSING_UNIT]: 'יחידות דיור',
      [EmailCommandType.PUBLISH_COMMERCIAL]: 'שטחים מסחריים',
      [EmailCommandType.PUBLISH_SHARED_OWNERSHIP]: 'טאבו משותף',
      [EmailCommandType.WANTED_BUY]: 'דירות למכירה', // דרוש
      [EmailCommandType.WANTED_RENT]: 'דירות להשכרה', // דרוש
      [EmailCommandType.WANTED_SHABBAT]: 'דירות לשבת', // דרוש
      [EmailCommandType.WANTED_COMMERCIAL]: 'שטחים מסחריים', // דרוש
      [EmailCommandType.WANTED_SHARED_OWNERSHIP]: 'טאבו משותף', // דרוש
    };
    return categoryMap[commandType] || null;
  }

  /**
   * בדיקה האם זו בקשה מסוג "דרוש"
   */
  isWantedRequest(commandType: EmailCommandType): boolean {
    return [
      EmailCommandType.WANTED_BUY,
      EmailCommandType.WANTED_RENT,
      EmailCommandType.WANTED_SHABBAT,
      EmailCommandType.WANTED_COMMERCIAL,
      EmailCommandType.WANTED_SHARED_OWNERSHIP,
    ].includes(commandType);
  }
}

// Export singleton instance
export const emailCommandParser = new EmailCommandParser();
