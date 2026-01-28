/**
 * 🧪 Email Testing Controller (DEV ONLY)
 * 
 * מאפשר לבדוק כל סוג מייל עם נתוני דמה
 * לשימוש רק בסביבת פיתוח עם Mailtrap
 */

import { Request, Response } from 'express';
import { unifiedEmailService } from './unified-email-template.service';
import { EmailType, getAllEmailTypes, getEmailTypesByCategory } from './email-types.enum';
import { config } from '../../config';

class EmailTestingController {
  /**
   * שליחת מייל טסט לפי type
   * POST /api/email-testing/send/:emailType
   */
  async sendTestEmail(req: Request, res: Response) {
    try {
      // בדיקה שזו סביבת פיתוח
      if (config.nodeEnv === 'production') {
        return res.status(403).json({
          error: 'Email testing is only available in development mode',
        });
      }

      const { emailType } = req.params;
      const { customEmail } = req.body; // אופציונלי - כתובת מייל חלופית
      
      // בדיקה ש-emailType תקין
      if (!Object.values(EmailType).includes(emailType as EmailType)) {
        return res.status(400).json({
          error: 'Invalid email type',
          validTypes: getAllEmailTypes(),
        });
      }

      const type = emailType as EmailType;
      const testEmail = customEmail || 'test@mailtrap.io';

      // קבלת נתוני דמה לפי סוג המייל
      const params = this.getMockDataForEmailType(type, testEmail);

      // שליחת המייל
      await unifiedEmailService.sendEmail(params);

      res.json({
        success: true,
        message: `Test email sent successfully`,
        emailType: type,
        sentTo: testEmail,
        mockData: params,
      });
    } catch (error: any) {
      console.error('❌ Test email send error:', error);
      res.status(500).json({
        error: 'Failed to send test email',
        details: error.message,
      });
    }
  }

  /**
   * שליחת כל סוגי המיילים ברצף
   * POST /api/email-testing/send-all
   */
  async sendAllTestEmails(req: Request, res: Response) {
    try {
      if (config.nodeEnv === 'production') {
        return res.status(403).json({
          error: 'Email testing is only available in development mode',
        });
      }

      const { customEmail } = req.body;
      const testEmail = customEmail || 'test@mailtrap.io';

      const allTypes = getAllEmailTypes();
      const results: any[] = [];

      for (const type of allTypes) {
        try {
          const params = this.getMockDataForEmailType(type, testEmail);
          await unifiedEmailService.sendEmail(params);
          
          results.push({
            type,
            status: 'success',
          });

          // המתנה קצרה בין מיילים
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          results.push({
            type,
            status: 'failed',
            error: error.message,
          });
        }
      }

      res.json({
        success: true,
        message: `Sent ${results.filter(r => r.status === 'success').length}/${allTypes.length} test emails`,
        results,
        sentTo: testEmail,
      });
    } catch (error: any) {
      console.error('❌ Send all test emails error:', error);
      res.status(500).json({
        error: 'Failed to send all test emails',
        details: error.message,
      });
    }
  }

  /**
   * קבלת רשימת כל סוגי המיילים
   * GET /api/email-testing/types
   */
  async getEmailTypes(req: Request, res: Response) {
    try {
      const { format } = req.query;
      
      const allTypes = getAllEmailTypes();
      const categorized = {
        auth: getEmailTypesByCategory('auth'),
        ads: getEmailTypesByCategory('ads'),
        appointments: getEmailTypesByCategory('appointments'),
        mailing: getEmailTypesByCategory('mailing'),
        distribution: getEmailTypesByCategory('distribution'),
        errors: getEmailTypesByCategory('errors'),
        admin: getEmailTypesByCategory('admin'),
      };

      // אם ביקשו JSON
      if (format === 'json') {
        return res.json({
          success: true,
          totalTypes: allTypes.length,
          allTypes,
          categorized,
        });
      }

      // ברירת מחדל: HTML יפה
      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>📧 Email Testing - מערכת בדיקת מיילים</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
              min-height: 100vh;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              padding: 40px;
            }
            h1 {
              color: #2d3748;
              margin-bottom: 10px;
              font-size: 2.5em;
              text-align: center;
            }
            .subtitle {
              text-align: center;
              color: #718096;
              margin-bottom: 40px;
              font-size: 1.1em;
            }
            .stats {
              display: flex;
              gap: 20px;
              justify-content: center;
              margin-bottom: 40px;
              flex-wrap: wrap;
            }
            .stat-card {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px 40px;
              border-radius: 15px;
              text-align: center;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }
            .stat-number {
              font-size: 3em;
              font-weight: bold;
              line-height: 1;
            }
            .stat-label {
              font-size: 0.9em;
              opacity: 0.9;
              margin-top: 5px;
            }
            .categories {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .category {
              background: #f7fafc;
              border-radius: 15px;
              padding: 25px;
              border: 2px solid #e2e8f0;
              transition: all 0.3s ease;
            }
            .category:hover {
              transform: translateY(-5px);
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              border-color: #667eea;
            }
            .category-header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 2px solid #e2e8f0;
            }
            .category-icon {
              font-size: 2em;
            }
            .category-title {
              font-size: 1.3em;
              color: #2d3748;
              font-weight: 600;
            }
            .category-count {
              margin-right: auto;
              background: #667eea;
              color: white;
              padding: 3px 10px;
              border-radius: 20px;
              font-size: 0.85em;
              font-weight: bold;
            }
            .email-type {
              background: white;
              padding: 12px 15px;
              margin: 8px 0;
              border-radius: 8px;
              border-right: 4px solid #667eea;
              transition: all 0.2s ease;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .email-type:hover {
              transform: translateX(-5px);
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            .email-type-name {
              font-family: 'Courier New', monospace;
              color: #4a5568;
              font-size: 0.9em;
              flex: 1;
            }
            .test-button {
              background: #48bb78;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 0.85em;
              transition: all 0.2s ease;
              opacity: 0;
            }
            .email-type:hover .test-button {
              opacity: 1;
            }
            .test-button:hover {
              background: #38a169;
              transform: scale(1.05);
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 30px;
              border-top: 2px solid #e2e8f0;
              color: #718096;
            }
            .api-info {
              background: #edf2f7;
              padding: 20px;
              border-radius: 10px;
              margin-top: 20px;
              direction: ltr;
              text-align: left;
            }
            .api-info code {
              background: #2d3748;
              color: #68d391;
              padding: 2px 8px;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
            }
            .category.auth { border-color: #4299e1; }
            .category.auth:hover { border-color: #3182ce; }
            .category.auth .email-type { border-right-color: #4299e1; }
            
            .category.ads { border-color: #48bb78; }
            .category.ads:hover { border-color: #38a169; }
            .category.ads .email-type { border-right-color: #48bb78; }
            
            .category.appointments { border-color: #ed8936; }
            .category.appointments:hover { border-color: #dd6b20; }
            .category.appointments .email-type { border-right-color: #ed8936; }
            
            .category.mailing { border-color: #9f7aea; }
            .category.mailing:hover { border-color: #805ad5; }
            .category.mailing .email-type { border-right-color: #9f7aea; }
            
            .category.distribution { border-color: #f56565; }
            .category.distribution:hover { border-color: #e53e3e; }
            .category.distribution .email-type { border-right-color: #f56565; }
            
            .category.errors { border-color: #fc8181; }
            .category.errors:hover { border-color: #f56565; }
            .category.errors .email-type { border-right-color: #fc8181; }
            
            .category.admin { border-color: #667eea; }
            .category.admin:hover { border-color: #5a67d8; }
            .category.admin .email-type { border-right-color: #667eea; }
            
            .token-section {
              background: #fff5f5;
              border: 2px solid #fc8181;
              border-radius: 15px;
              padding: 25px;
              margin-bottom: 30px;
            }
            .token-section.has-token {
              background: #f0fff4;
              border-color: #48bb78;
            }
            .token-header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 15px;
              font-size: 1.2em;
              font-weight: bold;
            }
            .token-input-group {
              display: flex;
              gap: 10px;
            }
            .token-input {
              flex: 1;
              padding: 12px 15px;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              font-size: 1em;
              font-family: 'Courier New', monospace;
            }
            .token-input:focus {
              outline: none;
              border-color: #667eea;
            }
            .save-token-btn {
              background: #667eea;
              color: white;
              border: none;
              padding: 12px 30px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 1em;
              font-weight: bold;
              transition: all 0.2s ease;
            }
            .save-token-btn:hover {
              background: #5a67d8;
              transform: scale(1.05);
            }
            .token-status {
              margin-top: 10px;
              font-size: 0.9em;
              color: #718096;
            }
            .notification {
              position: fixed;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: white;
              border-radius: 10px;
              padding: 15px 25px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
              z-index: 1000;
              display: none;
              min-width: 300px;
              text-align: center;
            }
            .notification.show {
              display: block;
              animation: slideDown 0.3s ease;
            }
            .notification.success {
              border-right: 4px solid #48bb78;
            }
            .notification.error {
              border-right: 4px solid #f56565;
            }
            .notification.loading {
              border-right: 4px solid #667eea;
            }
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
            }
            .loading-spinner {
              display: inline-block;
              width: 16px;
              height: 16px;
              border: 3px solid rgba(102, 126, 234, 0.3);
              border-top-color: #667eea;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin-left: 8px;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div id="notification" class="notification"></div>
          
          <div class="container">
            <h1>📧 Email Testing System</h1>
            <p class="subtitle">מערכת בדיקת מיילים - מיעדליעד</p>
            
            <div class="stats">
              <div class="stat-card">
                <div class="stat-number">${allTypes.length}</div>
                <div class="stat-label">סוגי מיילים</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">7</div>
                <div class="stat-label">קטגוריות</div>
              </div>
            </div>

            <div id="tokenSection" class="token-section">
              <div class="token-header">
                🔑 Admin Token (נדרש לבדיקות)
              </div>
              <div class="token-input-group">
                <input 
                  type="text" 
                  id="tokenInput" 
                  class="token-input" 
                  placeholder="הכנס/י את ה-Admin Token שלך כאן..."
                >
                <button class="save-token-btn" id="saveTokenBtn">שמור Token</button>
              </div>
              <div id="tokenStatus" class="token-status">
                ⚠️ Token לא נשמר - תצטרך/י token של Admin כדי לשלוח מיילי בדיקה
              </div>
            </div>

            <div class="categories">
              <div class="category auth">
                <div class="category-header">
                  <span class="category-icon">🔐</span>
                  <span class="category-title">Authentication</span>
                  <span class="category-count">${categorized.auth.length}</span>
                </div>
                ${categorized.auth.map(type => `
                  <div class="email-type" data-email-type="${type}">
                    <span class="email-type-name">${type}</span>
                    <button class="test-button">בדיקה</button>
                  </div>
                `).join('')}
              </div>

              <div class="category ads">
                <div class="category-header">
                  <span class="category-icon">📝</span>
                  <span class="category-title">Ads Lifecycle</span>
                  <span class="category-count">${categorized.ads.length}</span>
                </div>
                ${categorized.ads.map(type => `
                  <div class="email-type" data-email-type="${type}">
                    <span class="email-type-name">${type}</span>
                    <button class="test-button">בדיקה</button>
                  </div>
                `).join('')}
              </div>

              <div class="category appointments">
                <div class="category-header">
                  <span class="category-icon">📅</span>
                  <span class="category-title">Appointments</span>
                  <span class="category-count">${categorized.appointments.length}</span>
                </div>
                ${categorized.appointments.map(type => `
                  <div class="email-type" data-email-type="${type}">
                    <span class="email-type-name">${type}</span>
                    <button class="test-button">בדיקה</button>
                  </div>
                `).join('')}
              </div>

              <div class="category mailing">
                <div class="category-header">
                  <span class="category-icon">📬</span>
                  <span class="category-title">Mailing Lists</span>
                  <span class="category-count">${categorized.mailing.length}</span>
                </div>
                ${categorized.mailing.map(type => `
                  <div class="email-type" data-email-type="${type}">
                    <span class="email-type-name">${type}</span>
                    <button class="test-button">בדיקה</button>
                  </div>
                `).join('')}
              </div>

              <div class="category distribution">
                <div class="category-header">
                  <span class="category-icon">📨</span>
                  <span class="category-title">Distribution</span>
                  <span class="category-count">${categorized.distribution.length}</span>
                </div>
                ${categorized.distribution.map(type => `
                  <div class="email-type" data-email-type="${type}">
                    <span class="email-type-name">${type}</span>
                    <button class="test-button">בדיקה</button>
                  </div>
                `).join('')}
              </div>

              <div class="category errors">
                <div class="category-header">
                  <span class="category-icon">⚠️</span>
                  <span class="category-title">Errors</span>
                  <span class="category-count">${categorized.errors.length}</span>
                </div>
                ${categorized.errors.map(type => `
                  <div class="email-type" data-email-type="${type}">
                    <span class="email-type-name">${type}</span>
                    <button class="test-button">בדיקה</button>
                  </div>
                `).join('')}
              </div>

              <div class="category admin">
                <div class="category-header">
                  <span class="category-icon">👨‍💼</span>
                  <span class="category-title">Admin</span>
                  <span class="category-count">${categorized.admin.length}</span>
                </div>
                ${categorized.admin.map(type => `
                  <div class="email-type" data-email-type="${type}">
                    <span class="email-type-name">${type}</span>
                    <button class="test-button">בדיקה</button>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="api-info">
              <strong>API Endpoints:</strong><br><br>
              <code>GET /api/email-testing/types?format=json</code> - קבלת JSON גולמי<br>
              <code>POST /api/email-testing/send/:emailType</code> - שליחת מייל בדיקה (נדרש Admin token)<br>
              <code>POST /api/email-testing/send-all</code> - שליחת כל המיילים (נדרש Super Admin token)
            </div>

            <div class="footer">
              <p>🧪 Email Testing System | Development Only</p>
              <p style="margin-top: 5px; font-size: 0.9em;">כל המיילים נשלחים ל-Mailtrap בסביבת פיתוח</p>
            </div>
          </div>

          <script>
            let adminToken = localStorage.getItem('adminToken') || '';
            
            // Helper function to show notifications
            function showNotification(message, type) {
              const notification = document.getElementById('notification');
              notification.textContent = message;
              notification.className = 'notification show ' + type;
              
              if (type !== 'loading') {
                setTimeout(() => {
                  notification.classList.remove('show');
                }, 4000);
              }
            }

            function updateTokenStatus(hasToken) {
              const section = document.getElementById('tokenSection');
              const status = document.getElementById('tokenStatus');
              
              if (hasToken) {
                section.classList.add('has-token');
                status.innerHTML = '✅ Token שמור - אפשר לשלוח מיילי בדיקה!';
              } else {
                section.classList.remove('has-token');
                status.innerHTML = '⚠️ Token לא נשמר - תצטרך/י token של Admin כדי לשלוח מיילי בדיקה';
              }
            }

            function saveToken() {
              console.log('saveToken function called!');
              const input = document.getElementById('tokenInput');
              console.log('Input element:', input);
              
              if (!input) {
                console.error('Token input not found!');
                return;
              }
              
              adminToken = input.value.trim();
              console.log('Token value:', adminToken ? 'Token exists (length: ' + adminToken.length + ')' : 'Empty');
              
              if (adminToken) {
                localStorage.setItem('adminToken', adminToken);
                updateTokenStatus(true);
                showNotification('✅ Token נשמר בהצלחה!', 'success');
                console.log('Token saved to localStorage');
              } else {
                localStorage.removeItem('adminToken');
                updateTokenStatus(false);
                showNotification('⚠️ Token הוסר', 'error');
                console.log('Token removed from localStorage');
              }
            }

            async function testEmail(emailType) {
              if (!adminToken) {
                showNotification('⚠️ נדרש Admin Token! הכנס/י token למעלה', 'error');
                document.getElementById('tokenInput').focus();
                return;
              }

              showNotification('📤 שולח מייל בדיקה...', 'loading');

              try {
                const response = await fetch('/api/email-testing/send/' + emailType, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + adminToken
                  },
                  body: JSON.stringify({})
                });

                const data = await response.json();

                if (response.ok && data.success) {
                  showNotification('✅ מייל נשלח בהצלחה! בדוק/י את Mailtrap', 'success');
                  console.log('Email sent:', data);
                } else {
                  showNotification('❌ שגיאה: ' + (data.error || data.message || 'לא ידוע'), 'error');
                  console.error('Error:', data);
                }
              } catch (error) {
                showNotification('❌ שגיאת תקשורת עם השרת', 'error');
                console.error('Network error:', error);
              }
            }

            // Load token on page load and setup event listeners
            document.addEventListener('DOMContentLoaded', () => {
              console.log('=== DOMContentLoaded event fired ===');
              
              // Load saved token
              if (adminToken) {
                const tokenInput = document.getElementById('tokenInput');
                if (tokenInput) {
                  tokenInput.value = adminToken;
                  updateTokenStatus(true);
                  console.log('Token loaded from localStorage');
                } else {
                  console.error('tokenInput element not found!');
                }
              }
              
              // Save token button
              const saveBtn = document.getElementById('saveTokenBtn');
              console.log('Save button element:', saveBtn);
              
              if (saveBtn) {
                saveBtn.addEventListener('click', (e) => {
                  console.log('Save button clicked!');
                  saveToken();
                });
                console.log('✅ Click listener attached to save button');
              } else {
                console.error('❌ saveTokenBtn element not found!');
              }
              
              // Allow Enter key to save token
              const tokenInput = document.getElementById('tokenInput');
              if (tokenInput) {
                tokenInput.addEventListener('keypress', (e) => {
                  console.log('Key pressed:', e.key);
                  if (e.key === 'Enter') {
                    console.log('Enter key detected, calling saveToken');
                    saveToken();
                  }
                });
                console.log('✅ Keypress listener attached to input');
              } else {
                console.error('❌ tokenInput element not found!');
              }
              
              // Add click handlers to all email type elements
              const emailElements = document.querySelectorAll('.email-type');
              console.log('Found email type elements:', emailElements.length);
              
              emailElements.forEach(element => {
                element.addEventListener('click', (e) => {
                  const emailType = element.getAttribute('data-email-type');
                  console.log('Email type clicked:', emailType);
                  testEmail(emailType);
                });
              });
              console.log('✅ Click listeners attached to', emailElements.length, 'email types');
              
              console.log('=== Setup complete ===');
            });
          </script>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'unsafe-inline' 'self'; style-src 'unsafe-inline' 'self'; img-src 'self' data:;");
      res.send(html);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to get email types',
        details: error.message,
      });
    }
  }

  /**
   * יצירת נתוני דמה לפי סוג מייל
   */
  private getMockDataForEmailType(type: EmailType, email: string): any {
    const baseParams = { to: email, type };

    switch (type) {
      // Auth
      case EmailType.USER_REGISTER_CONFIRMATION:
        return {
          ...baseParams,
          token: 'mock_verification_token_123456',
        };
      
      case EmailType.PASSWORD_RESET:
        return {
          ...baseParams,
          token: 'mock_reset_token_123456',
        };
      
      case EmailType.ACCOUNT_DELETION_CONFIRMATION:
        return baseParams;

      // Email Operations - Not Registered
      case EmailType.USER_NOT_REGISTERED_REDIRECT_TO_SIGNUP:
        return baseParams;

      // Email Operations - Ad Requests
      case EmailType.AD_PUBLISH_REQUEST_RECEIVED:
      case EmailType.AD_WANTED_REQUEST_RECEIVED:
      case EmailType.AD_UPDATE_REQUEST_RECEIVED:
      case EmailType.AD_REMOVE_REQUEST_RECEIVED:
      case EmailType.AD_FORM_LINK_SENT:
        return {
          ...baseParams,
          formUrl: 'https://forms.google.com/mock-form-123',
          requestId: 'req_mock_123456',
        };

      // Ad Lifecycle
      case EmailType.AD_CREATED_PENDING_APPROVAL:
        return {
          ...baseParams,
          adTitle: 'דירה 3 חדרים להשכרה בתל אביב',
        };
      
      case EmailType.AD_APPROVED:
        return {
          ...baseParams,
          adTitle: 'דירה 3 חדרים להשכרה בתל אביב',
          adId: 'mock_ad_123',
          adNumber: '12345',
        };
      
      case EmailType.AD_REJECTED:
        return {
          ...baseParams,
          adTitle: 'דירה 3 חדרים להשכרה',
          reason: 'פרטי קשר חסרים במודעה',
        };
      
      case EmailType.AD_COPY_WITH_PDF:
        return {
          ...baseParams,
          adTitle: 'דירה 3 חדרים להשכרה',
          adId: 'mock_ad_123',
          adNumber: '12345',
          contactName: 'ישראל ישראלי',
          pdfBuffer: Buffer.from('Mock PDF content'),
        };
      
      case EmailType.AD_UPDATED_CONFIRMATION:
        return {
          ...baseParams,
          adTitle: 'דירה 3 חדרים להשכרה',
          adNumber: '12345',
        };
      
      case EmailType.AD_REMOVED_CONFIRMATION:
        return {
          ...baseParams,
          adTitle: 'דירה 3 חדרים להשכרה',
          adNumber: '12345',
        };

      // Appointments
      case EmailType.APPOINTMENT_REQUEST_SENT:
        return {
          ...baseParams,
          adTitle: 'דירה 3 חדרים להשכרה',
          adId: 'mock_ad_123',
          requesterName: 'משה כהן',
          date: new Date('2026-02-01T10:00:00'),
          note: 'מעוניין לראות את הדירה במהלך השבוע',
        };
      
      case EmailType.APPOINTMENT_APPROVED:
        return {
          ...baseParams,
          adTitle: 'דירה 3 חדרים להשכרה',
          adAddress: 'רחוב הרצל 10, תל אביב',
          ownerName: 'דוד לוי',
          ownerPhone: '050-1234567',
          date: new Date('2026-02-01T10:00:00'),
          icsContent: 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR',
        };
      
      case EmailType.APPOINTMENT_REJECTED:
        return {
          ...baseParams,
          adTitle: 'דירה 3 חדרים להשכרה',
          reason: 'הנכס כבר הושכר',
        };
      
      case EmailType.APPOINTMENT_RESCHEDULE:
        return {
          ...baseParams,
          adTitle: 'דירה 3 חדרים להשכרה',
          originalDate: new Date('2026-02-01T10:00:00'),
          newDate: new Date('2026-02-02T14:00:00'),
          appointmentId: 'mock_appointment_123',
        };

      // Mailing List
      case EmailType.MAILING_LIST_SUBSCRIBED:
        return {
          ...baseParams,
          categories: ['נדל"ן', 'רכב'],
          cities: ['תל אביב', 'ירושלים'],
          unsubscribeUrl: 'https://meyadleyad.com/unsubscribe?token=mock',
        };
      
      case EmailType.MAILING_LIST_UNSUBSCRIBED:
        return baseParams;
      
      case EmailType.MAILING_LIST_PREFERENCES_UPDATED:
        return baseParams;

      // Content Distribution
      case EmailType.WEEKLY_CONTENT_DISTRIBUTION:
      case EmailType.MANUAL_CONTENT_DISTRIBUTION:
        return {
          ...baseParams,
          content: '<h3>מודעות השבוע</h3><ul><li>דירה להשכרה - 4500 ש"ח</li><li>רכב למכירה - טויוטה קורולה</li></ul>',
          adsCount: 25,
        };

      // Errors
      case EmailType.AD_NOT_FOUND:
        return {
          ...baseParams,
          adNumber: '99999',
        };
      
      case EmailType.UNAUTHORIZED_ACTION:
        return {
          ...baseParams,
          reason: 'רק בעל המודעה יכול לערוך אותה',
        };
      
      case EmailType.RATE_LIMIT_EXCEEDED:
        return baseParams;
      
      case EmailType.EMAIL_OPERATION_ERROR:
        return {
          ...baseParams,
          reason: 'שגיאת מערכת זמנית',
        };

      // Admin
      case EmailType.ADMIN_NOTIFICATION:
      case EmailType.NEWSPAPER_SHEET_READY:
        return {
          ...baseParams,
          content: '<p>גיליון עיתון חדש מוכן להדפסה</p><p><a href="#">לחץ כאן להורדה</a></p>',
        };

      default:
        return baseParams;
    }
  }
}

export const emailTestingController = new EmailTestingController();
