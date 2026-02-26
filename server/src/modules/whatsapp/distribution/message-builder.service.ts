/**
 * WhatsApp Message Builder Service
 * בונה הודעות WhatsApp מתבניות עם תמיכה מלאה ב-RTL ועברית
 */

import { Ad, AdImage, Category, City, Street } from '@prisma/client';

export interface WhatsAppMessagePayload {
  messageText: string;
  imageUrl?: string;
  listingUrl: string;
  metadata: {
    adId: string;
    adNumber: number;
    title: string;
    city?: string;
    category?: string;
  };
}

export interface AdWithRelations extends Ad {
  Category?: Category | null;
  City?: City | null;
  Street?: Street | null;
  AdImage?: AdImage[];
}

export class WhatsAppMessageBuilderService {
  private readonly MAX_TEXT_LENGTH = 4000; // WhatsApp message limit
  private readonly BASE_URL = process.env.FRONTEND_URL || 'https://meyadleyad.com';

  /**
   * בניית הודעה מלאה למודעה
   */
  buildAdMessage(ad: AdWithRelations): WhatsAppMessagePayload {
    const messageText = this.formatAdMessage(ad);
    const imageUrl = this.getMainImage(ad);
    const listingUrl = this.buildListingUrl(ad);

    return {
      messageText,
      imageUrl,
      listingUrl,
      metadata: {
        adId: ad.id,
        adNumber: ad.adNumber,
        title: ad.title,
        city: ad.City?.nameHe,
        category: ad.Category?.nameHe,
      },
    };
  }

  /**
   * בניית הודעה מרוכזת (Digest) עבור מספר מודעות
   */
  buildDigestMessage(ads: AdWithRelations[], groupName: string): WhatsAppMessagePayload {
    let message = `📢 *עדכון נכסים חדשים - ${groupName}*\n`;
    message += `נוספו ${ads.length} נכסים חדשים:\n\n`;

    ads.forEach((ad, index) => {
      const shortDesc = this.buildShortAdDescription(ad);
      const url = this.buildListingUrl(ad);
      message += `${index + 1}. ${shortDesc}\n`;
      message += `   🔗 ${url}\n\n`;
    });

    message += `\n💡 לצפייה בכל הנכסים: ${this.BASE_URL}`;

    // Ensure not too long
    if (message.length > this.MAX_TEXT_LENGTH) {
      message = message.substring(0, this.MAX_TEXT_LENGTH - 3) + '...';
    }

    return {
      messageText: message,
      listingUrl: this.BASE_URL,
      metadata: {
        adId: 'digest',
        adNumber: 0,
        title: `Digest - ${groupName}`,
        city: '',
        category: '',
      },
    };
  }

  /**
   * פורמט הודעה מלאה למודעה בודדת
   */
  private formatAdMessage(ad: AdWithRelations): string {
    let message = '';

    // 1. קטגוריה (למשל דירה למכירה)
    if (ad.Category?.nameHe) {
      message += `${ad.Category.nameHe}\n\n`;
    }

    // 2. מספר חדרים, רחוב, שכונה ועיר
    const locationParts: string[] = [];
    
    if (ad.customFields && typeof ad.customFields === 'object') {
      const custom = ad.customFields as any;
      if (custom.rooms) {
        locationParts.push(`${custom.rooms} חדרים`);
      }
    }
    
    if (ad.Street?.name) {
      locationParts.push(ad.Street.name);
    }
    
    if (ad.neighborhood) {
      locationParts.push(ad.neighborhood);
    }
    
    if (ad.City?.nameHe) {
      locationParts.push(ad.City.nameHe);
    }
    
    if (locationParts.length > 0) {
      message += locationParts.join(', ') + '\n\n';
    }

    // 3. מאפיינים (כל מאפיין בשורה אחרת עם אייקון)
    const features = this.getFeaturesList(ad);
    if (features.length > 0) {
      features.forEach(feature => {
        message += `${feature}\n`;
      });
      message += '\n';
    }

    // 4. תיאור הנכס
    if (ad.description && ad.description.trim()) {
      message += `${this.sanitizeText(ad.description.trim())}\n\n`;
    }

    // 5. מחיר
    if (ad.price && ad.price > 0) {
      message += `מחיר: ${this.formatPrice(ad.price)}\n\n`;
    }

    // 6. קישור לצפייה בתמונות ולפרטים נוספים
    const url = this.buildListingUrl(ad);
    message += `לצפייה בתמונות ולפרטים נוספים לחצו כאן: ${url}\n\n`;

    // 7. קישור לקבוצת WhatsApp
    message += `רוצים לראות נכסים נוספים? הצטרפו לקבוצת הווצאפ מבית המקום: https://chat.whatsapp.com/DStrETiPZGJCLLrR9WP0Q3?mode=gi_t`;

    // Validate length
    if (message.length > this.MAX_TEXT_LENGTH) {
      message = message.substring(0, this.MAX_TEXT_LENGTH - 3) + '...';
    }

    return message;
  }

  /**
   * קבלת רשימת מאפיינים עם אייקונים
   */
  private getFeaturesList(ad: AdWithRelations): string[] {
    const features: string[] = [];
    
    if (!ad.customFields || typeof ad.customFields !== 'object') {
      return features;
    }

    const custom = ad.customFields as any;
    const featuresObj = custom.features || {};

    // מיפוי מאפיינים עם אייקונים
    const featureMap: Array<{ key: string; label: string; icon: string }> = [
      { key: 'storage', label: 'מחסן', icon: '📦' },
      { key: 'balcony', label: 'מרפסת', icon: '🏡' },
      { key: 'safeRoom', label: 'ממ"ד', icon: '🛡️' },
      { key: 'upgradedKitchen', label: 'מטבח משודרג', icon: '🍳' },
      { key: 'hasOption', label: 'אופציה', icon: '⭐' },
      { key: 'parking', label: 'חניה', icon: '🅿️' },
      { key: 'elevator', label: 'מעלית', icon: '🛗' },
      { key: 'airConditioning', label: 'מיזוג אוויר', icon: '❄️' },
      { key: 'sukkaBalcony', label: 'מרפסת סוכה', icon: '🌿' },
      { key: 'view', label: 'נוף', icon: '🌄' },
      { key: 'yard', label: 'חצר', icon: '🌳' },
      { key: 'garden', label: 'גינה', icon: '🌺' },
      { key: 'frontFacing', label: 'חזית', icon: '🏛️' },
      { key: 'accessibleForDisabled', label: 'נגישה לנכים', icon: '♿' },
      { key: 'housingUnit', label: 'יחידת דיור', icon: '🏘️' },
      { key: 'parentalUnit', label: 'יחידת הורים', icon: '👨‍👩‍👧' },
      { key: 'masterUnit', label: 'יחידת הורים', icon: '👨‍👩‍👧' },
      { key: 'pool', label: 'בריכה', icon: '🏊' },
      { key: 'kidsGames', label: 'משחקי ילדים', icon: '🎮' },
      { key: 'babyBed', label: 'מיטת תינוק', icon: '👶' },
      { key: 'gallery', label: 'גלריה', icon: '🎨' },
      { key: 'kitchenette', label: 'מטבחון', icon: '🍽️' },
      { key: 'toilets', label: 'שירותים', icon: '🚻' },
      { key: 'storefront', label: 'חלון ראווה לרחוב', icon: '🪟' },
      { key: 'internet', label: 'אינטרנט', icon: '📶' },
      { key: 'upgraded', label: 'מושפץ', icon: '✨' },
    ];

    featureMap.forEach(({ key, label, icon }) => {
      if (featuresObj[key]) {
        features.push(`${icon} ${label}`);
      }
    });

    return features;
  }

  /**
   * תיאור קצר למודעה (לשימוש ב-Digest)
   */
  private buildShortAdDescription(ad: AdWithRelations): string {
    const parts: string[] = [];

    parts.push(this.sanitizeText(ad.title));

    if (ad.City?.nameHe) {
      parts.push(ad.City.nameHe);
    }

    if (ad.price && ad.price > 0) {
      parts.push(this.formatPrice(ad.price));
    }

    // חדרים אם קיימים
    if (ad.customFields && typeof ad.customFields === 'object') {
      const custom = ad.customFields as any;
      if (custom.rooms) {
        parts.push(`${custom.rooms} חד'`);
      }
    }

    return parts.join(' · ');
  }

  /**
   * קבלת התמונה הראשית
   */
  private getMainImage(ad: AdWithRelations): string | undefined {
    if (!ad.AdImage || ad.AdImage.length === 0) {
      return undefined;
    }

    // Sort by order and get first
    const sorted = [...ad.AdImage].sort((a, b) => a.order - b.order);
    const mainImage = sorted[0];

    // Prefer branded URL if exists
    return mainImage.brandedUrl || mainImage.url;
  }

  /**
   * בניית URL קנוני למודעה
   */
  private buildListingUrl(ad: AdWithRelations): string {
    // Format: /ads/:id
    return `${this.BASE_URL}/ads/${ad.id}`;
  }

  /**
   * המרת טקסט ל-slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\u0590-\u05FFa-z0-9\s-]/g, '') // Keep Hebrew, English, numbers
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  /**
   * פורמט מחיר
   */
  private formatPrice(price: number): string {
    return `₪${price.toLocaleString('he-IL')}`;
  }

  /**
   * חיתוך טקסט עם ...
   */
  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    
    text = text.trim();
    
    if (text.length <= maxLength) {
      return text;
    }

    // Try to cut at word boundary
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  /**
   * סניטיזציה של טקסט - הסרת תווים מסוכנים
   */
  private sanitizeText(text: string): string {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\*/g, '') // Remove existing markdown bold
      .replace(/[_~`]/g, ''); // Remove markdown chars
  }

  /**
   * קבלת אייקון לפי קטגוריה
   */
  private getCategoryIcon(categorySlug?: string): string {
    if (!categorySlug) return '🏠';

    const iconMap: Record<string, string> = {
      'sale': '🏘️',
      'rent': '🔑',
      'commercial': '🏢',
      'shabbat': '🕯️',
      'shared': '🤝',
      'wanted': '🔍',
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (categorySlug.includes(key)) {
        return icon;
      }
    }

    return '🏠';
  }

  /**
   * בניית טקסט מלא להעתקה - רק טקסט ללא תמונות
   */
  buildClipboardText(ad: AdWithRelations): string {
    const payload = this.buildAdMessage(ad);
    
    // Return only the message text (no image URLs)
    return payload.messageText;
  }

  /**
   * יצירת deep link ל-WhatsApp Web עם טקסט מוכן
   */
  buildWhatsAppWebLink(text: string, phoneNumber?: string): string {
    const encodedText = encodeURIComponent(text);
    
    if (phoneNumber) {
      // Link to specific number
      return `https://wa.me/${phoneNumber}?text=${encodedText}`;
    }

    // Link to open WhatsApp with prefilled text
    return `https://web.whatsapp.com/send?text=${encodedText}`;
  }

  /**
   * יצירת WhatsApp URI scheme (פותח אפליקציה)
   */
  buildWhatsAppAppLink(text: string, phoneNumber?: string): string {
    const encodedText = encodeURIComponent(text);
    
    if (phoneNumber) {
      return `whatsapp://send?phone=${phoneNumber}&text=${encodedText}`;
    }

    return `whatsapp://send?text=${encodedText}`;
  }
}

// Export singleton
export const messageBuilder = new WhatsAppMessageBuilderService();
