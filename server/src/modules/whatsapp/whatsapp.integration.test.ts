import { WhatsAppService } from './whatsapp.service';
import { config } from '../../config';
import axios from 'axios';

// Mock axios for tests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * WhatsApp Integration Tests
 * 
 * בדיקות אלו משתמשות ב-Mock לבדיקת ה-flow.
 * לשליחה אמיתית, צריך WhatsApp Business API credentials.
 * 
 * Setup Guide:
 * 1. צור WhatsApp Business Account:
 *    https://business.facebook.com/
 * 
 * 2. הגדר Phone Number ב-WhatsApp Business API
 * 
 * 3. קבל Access Token מ-Meta App Dashboard
 * 
 * 4. הגדר משתני סביבה:
 *    WHATSAPP_API_URL=https://graph.facebook.com/v18.0
 *    WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
 *    WHATSAPP_ACCESS_TOKEN=your-access-token
 */

describe('WhatsApp Service - Integration Tests', () => {
  let whatsappService: WhatsAppService;

  beforeEach(() => {
    whatsappService = new WhatsAppService();
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should have WhatsApp configuration', () => {
      expect(config.whatsapp.apiUrl).toBeTruthy();
      expect(config.whatsapp.phoneNumberId).toBeDefined();
      expect(config.whatsapp.accessToken).toBeDefined();

      console.log('📱 WhatsApp Configuration:');
      console.log(`   API URL: ${config.whatsapp.apiUrl}`);
      console.log(`   Phone Number ID: ${config.whatsapp.phoneNumberId ? '✅ Set' : '❌ Not Set'}`);
      console.log(`   Access Token: ${config.whatsapp.accessToken ? '✅ Set' : '❌ Not Set'}`);
    });
  });

  describe('Message Sending - Mock Tests', () => {
    it('should send simple text message', async () => {
      const mockResponse = {
        data: {
          messaging_product: 'whatsapp',
          contacts: [{ input: '972501234567', wa_id: '972501234567' }],
          messages: [{ id: 'wamid.test123' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await whatsappService.sendMessage('972501234567', 'הודעת בדיקה');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.objectContaining({
          messaging_product: 'whatsapp',
          to: '972501234567',
          type: 'text',
          text: { body: 'הודעת בדיקה' },
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse.data);
      console.log('✅ Simple message mock test passed');
    });

    it('should send ad to group with proper formatting', async () => {
      const mockResponse = {
        data: {
          messaging_product: 'whatsapp',
          messages: [{ id: 'wamid.test456' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const ad = {
        title: 'דירת 3 חדרים למכירה',
        description: 'דירה מרווחת ומוארת בלב העיר',
        price: 1500000,
        category: 'נדל"ן',
        city: 'תל אביב',
        url: 'https://meyadleyad.com/ad/123',
      };

      const result = await whatsappService.sendAdToGroup('120363123456789@g.us', ad);

      expect(mockedAxios.post).toHaveBeenCalled();
      
      const callArgs = mockedAxios.post.mock.calls[0];
      const messageBody = callArgs[1].text.body;

      // Verify Hebrew RTL content
      expect(messageBody).toContain('דירת 3 חדרים למכירה');
      expect(messageBody).toContain('₪1,500,000');
      expect(messageBody).toContain('נדל"ן');
      expect(messageBody).toContain('תל אביב');
      expect(messageBody).toContain(ad.url);
      
      // Verify emojis
      expect(messageBody).toContain('🔔');
      expect(messageBody).toContain('💰');
      expect(messageBody).toContain('📂');
      expect(messageBody).toContain('📍');
      expect(messageBody).toContain('🔗');

      console.log('✅ Ad to group formatting test passed');
      console.log('📱 Sample message:');
      console.log(messageBody);
    });

    it('should send template message', async () => {
      const mockResponse = {
        data: {
          messaging_product: 'whatsapp',
          messages: [{ id: 'wamid.test789' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await whatsappService.sendTemplateMessage(
        '972501234567',
        'ad_approved_notification',
        ['דירת 3 חדרים', 'https://meyadleyad.com/ad/123']
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.objectContaining({
          messaging_product: 'whatsapp',
          type: 'template',
          template: expect.objectContaining({
            name: 'ad_approved_notification',
            language: { code: 'he' },
          }),
        }),
        expect.any(Object)
      );

      console.log('✅ Template message test passed');
    });
  });

  describe('Message Formatting', () => {
    it('should handle Hebrew text and emojis correctly', async () => {
      mockedAxios.post.mockResolvedValue({ data: { messages: [{ id: 'test' }] } });

      const hebrewMessage = '🏠 דירת יוקרה עם נוף לים 🌊\nמחיר: ₪2,000,000 💎';
      
      await whatsappService.sendMessage('972501234567', hebrewMessage);

      const callArgs = mockedAxios.post.mock.calls[0];
      const sentMessage = callArgs[1].text.body;

      expect(sentMessage).toBe(hebrewMessage);
      console.log('✅ Hebrew + Emoji formatting preserved');
    });

    it('should format price with comma separators', async () => {
      mockedAxios.post.mockResolvedValue({ data: { messages: [{ id: 'test' }] } });

      const ad = {
        title: 'Test Ad',
        description: 'Test Description',
        price: 1234567,
        category: 'קטגוריה',
        url: 'https://test.com',
      };

      await whatsappService.sendAdToGroup('group-id', ad);

      const callArgs = mockedAxios.post.mock.calls[0];
      const messageBody = callArgs[1].text.body;

      expect(messageBody).toContain('₪1,234,567');
      console.log('✅ Price formatting with commas works');
    });

    it('should handle ads without optional fields', async () => {
      mockedAxios.post.mockResolvedValue({ data: { messages: [{ id: 'test' }] } });

      const ad = {
        title: 'Minimal Ad',
        description: 'Description only',
        category: 'קטגוריה',
        url: 'https://test.com',
      };

      await whatsappService.sendAdToGroup('group-id', ad);

      const callArgs = mockedAxios.post.mock.calls[0];
      const messageBody = callArgs[1].text.body;

      expect(messageBody).toContain('Minimal Ad');
      expect(messageBody).toContain('Description only');
      expect(messageBody).not.toContain('💰 מחיר');
      expect(messageBody).not.toContain('📍 עיר');
      
      console.log('✅ Optional fields handled correctly');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const apiError = {
        response: {
          status: 401,
          data: {
            error: {
              message: 'Invalid OAuth access token',
              type: 'OAuthException',
            },
          },
        },
        message: 'Request failed with status code 401',
      };

      mockedAxios.post.mockRejectedValue(apiError);

      await expect(
        whatsappService.sendMessage('972501234567', 'Test')
      ).rejects.toMatchObject({
        response: {
          status: 401,
        },
      });

      console.log('✅ API error handling works');
    });

    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      await expect(
        whatsappService.sendMessage('972501234567', 'Test')
      ).rejects.toThrow('Network Error');

      console.log('✅ Network error handling works');
    });
  });

  describe('Authentication', () => {
    it('should include authorization header in requests', async () => {
      mockedAxios.post.mockResolvedValue({ data: { messages: [{ id: 'test' }] } });

      await whatsappService.sendMessage('972501234567', 'Test');

      const callArgs = mockedAxios.post.mock.calls[0];
      const headers = callArgs[2].headers;

      expect(headers).toHaveProperty('Authorization');
      expect(headers.Authorization).toContain('Bearer');
      
      console.log('✅ Authorization header included');
    });
  });
});

/**
 * Manual Testing Guide for Real WhatsApp Integration:
 * 
 * 1. Prerequisites:
 *    - WhatsApp Business Account
 *    - Phone Number registered with WhatsApp Business API
 *    - Access Token from Meta for Developers
 * 
 * 2. Configuration (.env):
 *    WHATSAPP_API_URL=https://graph.facebook.com/v18.0
 *    WHATSAPP_PHONE_NUMBER_ID=123456789012345
 *    WHATSAPP_ACCESS_TOKEN=your-permanent-token
 * 
 * 3. Testing Flow:
 *    a. Send test message to your phone number
 *    b. Verify Hebrew RTL rendering
 *    c. Verify emojis display correctly
 *    d. Test template messages (requires pre-approved templates)
 *    e. Test group messaging (requires group ID)
 * 
 * 4. Production Checklist:
 *    ✅ Phone number verified
 *    ✅ Access token is permanent (not temporary)
 *    ✅ Message templates approved by Meta
 *    ✅ Rate limits configured
 *    ✅ Error handling & logging in place
 *    ✅ Webhook configured for delivery receipts
 * 
 * 5. Common Issues:
 *    - Error 131030: Phone number not registered
 *    - Error 131031: Recipient not on WhatsApp
 *    - Error 131047: Re-engagement message needed
 *    - Error 131048: Template rejected
 * 
 * 6. Testing Without Real API:
 *    - Use the mock tests above
 *    - Set environment variable: MOCK_WHATSAPP=true
 *    - Service will log messages instead of sending
 */
