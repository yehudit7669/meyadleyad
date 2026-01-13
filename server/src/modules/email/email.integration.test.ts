import { EmailService } from './email.service';
import { config } from '../../config';
import * as nodemailer from 'nodemailer';

// Mock nodemailer for safe testing
jest.mock('nodemailer');
const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

/**
 * Email Integration Tests
 * 
 * בדיקות אלו משתמשות ב-Mock לבדיקת ה-flow.
 * לשליחה אמיתית, הגדר משתני סביבה והסר את ה-mock.
 * 
 * Mock Mode (default):
 * - בודק יצירת מייל
 * - בודק בחירת template
 * - בודק קריאה ל-sendMail עם הנתונים הנכונים
 * 
 * Real Mode (optional):
 * 1. הסר את jest.mock('nodemailer')
 * 2. הגדר משתני סביבה:
 *    - EMAIL_HOST (default: smtp.gmail.com)
 *    - EMAIL_PORT (default: 587)
 *    - EMAIL_USER (required)
 *    - EMAIL_PASSWORD (required - App Password אם Gmail)
 *    - EMAIL_FROM (optional)
 * 3. הרץ: npm test -- email.integration.test.ts
 */

describe('Email Service - Integration Tests', () => {
  let emailService: EmailService;
  let mockSendMail: jest.Mock;

  beforeEach(() => {
    // Create mock transporter
    mockSendMail = jest.fn().mockResolvedValue({
      accepted: ['test@example.com'],
      rejected: [],
      messageId: '<test-message-id@example.com>',
    });

    const mockTransporter = {
      sendMail: mockSendMail,
    };

    mockedNodemailer.createTransport.mockReturnValue(mockTransporter as any);

    emailService = new EmailService();
    jest.clearAllMocks();
  });

  describe('SMTP Configuration', () => {
    it('should have valid SMTP configuration', () => {
      expect(config.email.host).toBeTruthy();
      expect(config.email.port).toBeGreaterThan(0);
      expect(config.email.from).toBeTruthy();
      
      console.log('✅ SMTP Configuration:');
      console.log(`   Host: ${config.email.host}`);
      console.log(`   Port: ${config.email.port}`);
      console.log(`   From: ${config.email.from}`);
      console.log('   Transporter: Mocked (nodemailer)');
    });
  });

  describe('Email Sending - Mock Tests', () => {
    it('should send verification email with correct template', async () => {
      const testEmail = 'user@example.com';
      const testToken = 'test-verification-token-123';
      
      console.log(`\n📧 Testing verification email to: ${testEmail}`);
      
      await emailService.sendVerificationEmail(testEmail, testToken);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          subject: expect.stringContaining('אימות'),
          html: expect.stringContaining(testToken),
        })
      );

      // Verify RTL HTML
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('dir="rtl"');

      console.log('✅ Verification email template validated');
      console.log(`   Token included: ${testToken}`);
    });

    it('should send password reset email with correct template', async () => {
      const testEmail = 'user@example.com';
      const testToken = 'test-reset-token-456';
      
      console.log(`\n📧 Testing password reset email to: ${testEmail}`);
      
      await emailService.sendPasswordResetEmail(testEmail, testToken);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          subject: expect.stringContaining('איפוס'),
          html: expect.stringContaining(testToken),
        })
      );

      // Verify RTL HTML
      const resetCallArgs = mockSendMail.mock.calls[0][0];
      expect(resetCallArgs.html).toContain('dir="rtl"');

      console.log('✅ Password reset email template validated');
    });

    it('should send ad created notification with correct data', async () => {
      const testEmail = 'user@example.com';
      const adTitle = 'דירת 3 חדרים למכירה';
      
      console.log(`\n📧 Testing ad created email to: ${testEmail}`);
      
      await emailService.sendAdCreatedEmail(testEmail, adTitle);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          subject: expect.stringContaining('מודעה'),
          html: expect.stringContaining(adTitle),
        })
      );

      console.log('✅ Ad created email template validated');
    });

    it('should send ad approved notification with correct data', async () => {
      const testEmail = 'user@example.com';
      const adTitle = 'דירת 3 חדרים למכירה';
      const adId = 'test-ad-id-123';
      
      console.log(`\n📧 Testing ad approved email to: ${testEmail}`);
      
      await emailService.sendAdApprovedEmail(testEmail, adTitle, adId);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          subject: expect.stringContaining('אושרה'),
          html: expect.stringContaining(adTitle),
        })
      );

      console.log('✅ Ad approved email template validated');
    });

    it('should send ad rejected notification with reason', async () => {
      const testEmail = 'user@example.com';
      const adTitle = 'דירת 3 חדרים למכירה';
      const reason = 'תוכן לא הולם';
      
      console.log(`\n📧 Testing ad rejected email to: ${testEmail}`);
      
      await emailService.sendAdRejectedEmail(testEmail, adTitle, reason);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          subject: expect.stringContaining('נדחתה'),
          html: expect.stringMatching(new RegExp(`${adTitle}.*${reason}`, 's')),
        })
      );

      console.log('✅ Ad rejected email template validated');
    });
  });

  describe('Email Content - RTL & Hebrew', () => {
    it('should contain proper RTL direction in HTML', async () => {
      const testEmail = 'user@example.com';
      const hebrewTitle = 'דירת 3 חדרים עם מרפסת שמש במרכז תל אביב 🏠';
      
      await emailService.sendAdCreatedEmail(testEmail, hebrewTitle);

      const callArgs = mockSendMail.mock.calls[0][0];
      
      // Verify RTL and Hebrew support
      expect(callArgs.html).toContain('dir="rtl"');
      expect(callArgs.html).toContain(hebrewTitle);

      console.log('✅ Hebrew RTL content validated in template!');
    });

    it('should handle emojis in email content', async () => {
      const testEmail = 'user@example.com';
      const titleWithEmojis = 'דירה למכירה 🏠 עם נוף לים 🌊';
      const token = 'emoji-test-123';

      await emailService.sendVerificationEmail(testEmail, titleWithEmojis);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('🏠');
      expect(callArgs.html).toContain('🌊');

      console.log('✅ Emojis preserved in email content');
    });
  });

  describe('Email Error Handling', () => {
    it('should handle sendMail errors gracefully', async () => {
      // Simulate email sending error
      mockSendMail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      await expect(
        emailService.sendVerificationEmail('user@example.com', 'token')
      ).rejects.toThrow('SMTP connection failed');

      console.log('✅ Error handling validated');
    });
  });
});

/**
 * Testing Strategy:
 * 
 * 🔄 Mock Mode (Default - Current):
 * - ✅ בודק template rendering
 * - ✅ בודק RTL support
 * - ✅ בודק Hebrew encoding
 * - ✅ בודק emoji support
 * - ✅ בודק sendMail calls
 * - ❌ לא שולח אימיילים אמיתיים
 * 
 * 📧 Real Mode (Optional - For Production Validation):
 * 1. הסר את jest.mock('nodemailer')
 * 2. הגדר משתני סביבה:
 *    EMAIL_HOST=smtp.gmail.com
 *    EMAIL_PORT=587
 *    EMAIL_USER=your-email@gmail.com
 *    EMAIL_PASSWORD=your-app-password (Gmail App Password)
 *    EMAIL_FROM="Meyadleyad <noreply@meyadleyad.com>"
 *    TEST_EMAIL=your-test-email@gmail.com
 * 
 * 3. הרץ: npm test -- email.integration.test.ts
 * 
 * Gmail App Password Setup:
 * - Google Account Settings → Security
 * - 2-Step Verification (חובה)
 * - App Passwords → Generate
 * - Use the 16-character password in EMAIL_PASSWORD
 * 
 * 4. Check Results:
 *    - בדוק את תיבת הדואר הנכנס
 *    - בדוק RTL rendering
 *    - בדוק קישורים (verification/reset URLs)
 *    - בדוק תמיכה בעברית ואמוג'י
 */
