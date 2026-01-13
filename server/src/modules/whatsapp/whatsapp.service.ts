import axios from 'axios';
import { config } from '../../config';

export class WhatsAppService {
  private apiUrl: string;
  private phoneNumberId: string;
  private accessToken: string;

  constructor() {
    this.apiUrl = config.whatsapp.apiUrl;
    this.phoneNumberId = config.whatsapp.phoneNumberId;
    this.accessToken = config.whatsapp.accessToken;
  }

  async sendMessage(to: string, message: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('WhatsApp send error:', error);
      throw error;
    }
  }

  async sendAdToGroup(groupId: string, ad: {
    title: string;
    description: string;
    price?: number;
    category: string;
    city?: string;
    url: string;
  }) {
    const message = this.formatAdMessage(ad);
    return this.sendMessage(groupId, message);
  }

  private formatAdMessage(ad: {
    title: string;
    description: string;
    price?: number;
    category: string;
    city?: string;
    url: string;
  }): string {
    let message = `🔔 *מודעה חדשה*\n\n`;
    message += `📌 *${ad.title}*\n\n`;
    message += `${ad.description}\n\n`;
    
    if (ad.price) {
      message += `💰 מחיר: ₪${ad.price.toLocaleString()}\n`;
    }
    
    message += `📂 קטגוריה: ${ad.category}\n`;
    
    if (ad.city) {
      message += `📍 עיר: ${ad.city}\n`;
    }
    
    message += `\n🔗 לצפייה במודעה: ${ad.url}`;
    
    return message;
  }

  async sendTemplateMessage(to: string, templateName: string, parameters: string[]) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'he' },
            components: [
              {
                type: 'body',
                parameters: parameters.map(param => ({ type: 'text', text: param })),
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('WhatsApp template send error:', error);
      throw error;
    }
  }
}
