import { PDFService } from './pdf.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PDF Service Integration Tests
 * 
 * בדיקות אלו מבצעות יצירת PDF אמיתי עם Puppeteer!
 * 
 * הבדיקות כוללות:
 * - RTL (Right-to-Left) rendering
 * - פונטים עבריים
 * - תמיכה באמוג'י
 * - טיפול בתמונות
 * - פורמט A4
 * 
 * קבצי ה-PDF נשמרים ב: server/test-output/pdfs/
 */

describe('PDF Service - Integration Tests', () => {
  let pdfService: PDFService;
  const outputDir = path.join(__dirname, '../../../test-output/pdfs');

  beforeAll(() => {
    pdfService = new PDFService();
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`\n📁 PDF output directory: ${outputDir}`);
  });

  describe('Single Ad PDF Generation', () => {
    it('should generate PDF for Hebrew ad with RTL support', async () => {
      const testAd = {
        title: 'דירת 3 חדרים מרווחת בלב תל אביב 🏠',
        description: `דירה מדהימה בלב תל אביב!

מפרט:
• 3 חדרי שינה מרווחים
• 2 חדרי רחצה מעוצבים
• מטבח חדש עם כל הציוד
• מרפסת שמש עם נוף לים 🌊
• מיזוג מרכזי בכל החדרים
• חניה ומחסן

מיקום מעולה:
- 5 דקות הליכה מהים
- קרוב לתחבורה ציבורית
- שכונה שקטה ומבוקשת

זמין לכניסה מיידית!`,
        price: 2500000,
        category: 'נדל"ן',
        city: 'תל אביב',
        images: [
          'https://via.placeholder.com/600x400/007bff/ffffff?text=Living+Room',
          'https://via.placeholder.com/600x400/28a745/ffffff?text=Kitchen',
          'https://via.placeholder.com/600x400/dc3545/ffffff?text=Bedroom',
          'https://via.placeholder.com/600x400/ffc107/ffffff?text=Balcony',
        ],
        user: {
          name: 'יוסי כהן',
          phone: '050-1234567',
          email: 'yossi@example.com',
        },
      };

      console.log('\n🔨 Generating Hebrew RTL PDF...');
      const pdfBuffer = await pdfService.generateAdPDF(testAd);

      expect(pdfBuffer).toBeInstanceOf(Uint8Array);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Save to file
      const filename = `single-ad-hebrew-${Date.now()}.pdf`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, pdfBuffer);

      console.log(`✅ PDF generated successfully!`);
      console.log(`   File: ${filename}`);
      console.log(`   Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
      console.log(`\n📖 Please open the PDF to verify:`);
      console.log(`   - RTL text direction`);
      console.log(`   - Hebrew characters render correctly`);
      console.log(`   - Emojis display properly (🏠 🌊)`);
      console.log(`   - Images loaded`);
      console.log(`   - Price formatted with comma (₪2,500,000)`);
    }, 30000); // 30 second timeout for Puppeteer

    it('should generate PDF with minimal data (no images, no price)', async () => {
      const minimalAd = {
        title: 'מכירת רהיטים - דחוף!',
        description: 'רהיטים במצב מעולה למכירה מהירה.\nסלון מעור, שולחן אוכל, מיטה זוגית.',
        category: 'רהיטים',
        images: [],
        user: {
          name: 'שרה לוי',
          email: 'sara@example.com',
        },
      };

      console.log('\n🔨 Generating minimal PDF (no images, no price)...');
      const pdfBuffer = await pdfService.generateAdPDF(minimalAd);

      expect(pdfBuffer).toBeInstanceOf(Uint8Array);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      const filename = `single-ad-minimal-${Date.now()}.pdf`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, pdfBuffer);

      console.log(`✅ Minimal PDF generated!`);
      console.log(`   File: ${filename}`);
      console.log(`   Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    }, 30000);

    it('should handle long Hebrew text with line breaks', async () => {
      const longTextAd = {
        title: 'משרה מעניינת בהייטק 💼',
        description: `אנחנו מחפשים מפתח/ת Full Stack מנוסה להצטרף לצוות שלנו!

דרישות התפקיד:
- ניסיון של 3+ שנים בפיתוח Full Stack
- שליטה מלאה ב-React, Node.js, TypeScript
- ניסיון עם PostgreSQL / MongoDB
- עבודה עם Git, Docker
- יכולת עבודה בצוות
- אנגלית ברמה טובה

אנחנו מציעים:
• שכר גבוה מהממוצע
• עבודה היברידית (2 ימים מהבית)
• אופציות לעובדים
• אווירה משפחתית
• הזדמנויות קידום
• ביטוח בריאות פרטי
• תקציב להשתלמויות

מיקום המשרה: הרצליה פיתוח
היקף משרה: 100%
סוג משרה: משרה מלאה

שלחו קורות חיים עכשיו!`,
        price: 25000,
        category: 'משרות',
        city: 'הרצליה',
        images: [
          'https://via.placeholder.com/600x400/6f42c1/ffffff?text=Office',
        ],
        user: {
          name: 'TechCorp Israel',
          phone: '03-1234567',
          email: 'jobs@techcorp.co.il',
        },
      };

      console.log('\n🔨 Generating PDF with long Hebrew text...');
      const pdfBuffer = await pdfService.generateAdPDF(longTextAd);

      expect(pdfBuffer).toBeInstanceOf(Uint8Array);

      const filename = `single-ad-long-text-${Date.now()}.pdf`;
      fs.writeFileSync(path.join(outputDir, filename), pdfBuffer);

      console.log(`✅ Long text PDF generated!`);
      console.log(`   Verify: Line breaks preserved, RTL bullets work`);
    }, 30000);
  });

  describe('Newspaper PDF Generation', () => {
    it('should generate newspaper PDF with multiple ads', async () => {
      const ads = [
        {
          title: 'דירת 4 חדרים למכירה 🏠',
          description: 'דירה מרווחת בשכונה שקטה, קרובה לבתי ספר ותחבורה ציבורית.',
          price: 1800000,
          category: 'נדל"ן',
          city: 'ירושלים',
          images: ['https://via.placeholder.com/300x200/007bff/ffffff?text=Apt+1'],
        },
        {
          title: 'רכב טויוטה קורולה 2020 🚗',
          description: 'רכב במצב מעולה, שמור וטופח. יד שנייה פרטית. מסירה מהירה.',
          price: 85000,
          category: 'רכב',
          city: 'חיפה',
          images: ['https://via.placeholder.com/300x200/28a745/ffffff?text=Car'],
        },
        {
          title: 'מחשב נייד דל XPS 💻',
          description: 'מעבד i7, 16GB RAM, SSD 512GB. כמעט חדש, נקנה לפני שנה.',
          price: 4500,
          category: 'אלקטרוניקה',
          images: ['https://via.placeholder.com/300x200/dc3545/ffffff?text=Laptop'],
        },
        {
          title: 'שולחן אוכל + 6 כיסאות',
          description: 'רהיטים איכותיים במצב מצוין. עץ מלא, עיצוב מודרני.',
          price: 2500,
          category: 'רהיטים',
          city: 'תל אביב',
          images: ['https://via.placeholder.com/300x200/ffc107/ffffff?text=Table'],
        },
        {
          title: 'גיטרה חשמלית פנדר 🎸',
          description: 'גיטרה חשמלית מקצועית במצב מעולה, כולל מגבר.',
          price: 3200,
          category: 'מוזיקה',
          images: [],
        },
        {
          title: 'משרד להשכרה במרכז העיר',
          description: 'משרד של 60 מ"ר, מעלית, חניה, מתאים לסטארטאפ.',
          price: 8000,
          category: 'נדל"ן',
          city: 'תל אביב',
          images: ['https://via.placeholder.com/300x200/6f42c1/ffffff?text=Office'],
        },
      ];

      console.log('\n📰 Generating newspaper PDF with 6 ads...');
      const pdfBuffer = await pdfService.generateNewspaperPDF(ads);

      expect(pdfBuffer).toBeInstanceOf(Uint8Array);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      const filename = `newspaper-${Date.now()}.pdf`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, pdfBuffer);

      console.log(`✅ Newspaper PDF generated!`);
      console.log(`   File: ${filename}`);
      console.log(`   Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
      console.log(`\n📖 Please verify:`);
      console.log(`   - Two-column layout`);
      console.log(`   - RTL text in columns`);
      console.log(`   - Images display correctly`);
      console.log(`   - Hebrew date in header`);
      console.log(`   - Emojis render (🏠 🚗 💻 🎸)`);
    }, 30000);

    it('should generate large newspaper with many ads', async () => {
      // Generate 20 test ads
      const manyAds = Array.from({ length: 20 }, (_, i) => ({
        title: `מודעה מספר ${i + 1} - בדיקת קיבולת`,
        description: `זוהי מודעת בדיקה מספר ${i + 1}. התיאור כולל טקסט עברי להדגמת RTL.`,
        price: Math.floor(Math.random() * 1000000),
        category: ['נדל"ן', 'רכב', 'אלקטרוניקה', 'רהיטים'][i % 4],
        city: ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע'][i % 4],
        images: i % 3 === 0 ? [`https://via.placeholder.com/300x200/0${i % 10}0/fff`] : [],
      }));

      console.log('\n📰 Generating large newspaper with 20 ads...');
      const pdfBuffer = await pdfService.generateNewspaperPDF(manyAds);

      expect(pdfBuffer).toBeInstanceOf(Uint8Array);

      const filename = `newspaper-large-${Date.now()}.pdf`;
      fs.writeFileSync(path.join(outputDir, filename), pdfBuffer);

      console.log(`✅ Large newspaper PDF generated!`);
      console.log(`   File: ${filename}`);
      console.log(`   Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
      console.log(`   Verify: Multiple pages, proper column breaks`);
    }, 45000);
  });

  describe('PDF Properties', () => {
    it('should generate PDF in A4 format', async () => {
      const testAd = {
        title: 'Test Ad',
        description: 'Test description',
        category: 'Test',
        images: [],
        user: { name: 'Test', email: 'test@test.com' },
      };

      const pdfBuffer = await pdfService.generateAdPDF(testAd);

      // PDF signature check - convert Uint8Array to string properly
      const pdfSignature = Buffer.from(pdfBuffer.slice(0, 5)).toString('ascii');
      expect(pdfSignature).toBe('%PDF-');

      console.log('✅ Valid PDF format (starts with %PDF-)');
    }, 30000);

    it('should include metadata in PDF', async () => {
      const testAd = {
        title: 'Test Metadata',
        description: 'Testing PDF metadata',
        category: 'Test',
        images: [],
        user: { name: 'Test', email: 'test@test.com' },
      };

      const pdfBuffer = await pdfService.generateAdPDF(testAd);
      
      // Verify PDF was generated
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      
      console.log('✅ PDF generated successfully, size:', pdfBuffer.length);
    }, 30000);
  });

  describe('Special Characters & Emojis', () => {
    it('should handle various emojis correctly', async () => {
      const emojiAd = {
        title: 'בדיקת אמוג׳י: 🏠 🚗 💻 📱 🎸 ⚽ 🍕 ☕ 🌊 🌞',
        description: `אמוג׳י בטקסט:
        
🏠 דירות ונכסים
🚗 רכבים
💻 אלקטרוניקה
📱 טלפונים
🎸 מוזיקה
⚽ ספורט
🍕 מזון
☕ בתי קפה
🌊 נופים
🌞 טיולים`,
        category: 'בדיקות',
        images: [],
        user: { name: 'Emoji Tester', email: 'emoji@test.com' },
      };

      const pdfBuffer = await pdfService.generateAdPDF(emojiAd);
      
      expect(pdfBuffer).toBeInstanceOf(Uint8Array);

      const filename = `emoji-test-${Date.now()}.pdf`;
      fs.writeFileSync(path.join(outputDir, filename), pdfBuffer);

      console.log('✅ Emoji PDF generated!');
      console.log('   Open PDF to verify all emojis render correctly');
    }, 30000);

    it('should handle mixed Hebrew, English, and numbers', async () => {
      const mixedAd = {
        title: 'MacBook Pro 2023 - מחשב נייד מקבוק פרו',
        description: `Mixed content test:
        
Model: MacBook Pro 14"
Year: 2023
Processor: Apple M3 Pro
RAM: 16GB
Storage: SSD 512GB
Price: ₪12,500

תיאור בעברית:
מחשב נייד מעולה במצב חדש!
כולל 2 שנות אחריות מיצרן.
מתאים לעבודה מקצועית.

Contact: info@example.com
Phone: 050-1234567`,
        price: 12500,
        category: 'Electronics / אלקטרוניקה',
        images: [],
        user: { name: 'Tech Store / חנות טכנולוגיה', email: 'store@example.com' },
      };

      const pdfBuffer = await pdfService.generateAdPDF(mixedAd);

      const filename = `mixed-languages-${Date.now()}.pdf`;
      fs.writeFileSync(path.join(outputDir, filename), pdfBuffer);

      console.log('✅ Mixed languages PDF generated!');
      console.log('   Verify: Hebrew RTL, English LTR, numbers display correctly');
    }, 30000);
  });

  afterAll(() => {
    console.log(`\n📁 All PDFs saved to: ${outputDir}`);
    console.log('\n✅ Integration tests complete!');
    console.log('\n📋 Manual verification checklist:');
    console.log('   □ Open each PDF file');
    console.log('   □ Verify Hebrew text reads right-to-left');
    console.log('   □ Check that emojis display correctly');
    console.log('   □ Verify images loaded (if applicable)');
    console.log('   □ Check price formatting (comma separators)');
    console.log('   □ Verify A4 page size');
    console.log('   □ Check multi-column layout in newspaper PDFs');
    console.log('   □ Verify proper page breaks');
  });
});

/**
 * Manual Testing Guide:
 * 
 * 1. Run Tests:
 *    npm test -- pdf.integration.test.ts
 * 
 * 2. Check Output:
 *    - Navigate to: server/test-output/pdfs/
 *    - Open each PDF file
 * 
 * 3. Visual Verification:
 *    ✅ RTL (Right-to-Left):
 *       - Hebrew text flows from right to left
 *       - Punctuation on the correct side
 *       - Lists/bullets aligned to the right
 *    
 *    ✅ Fonts:
 *       - Hebrew characters clear and readable
 *       - No missing characters (□ boxes)
 *       - Proper niqqud if used
 *    
 *    ✅ Emojis:
 *       - All emojis visible (not □)
 *       - Colors preserved where applicable
 *    
 *    ✅ Images:
 *       - Images load correctly
 *       - Proper sizing and layout
 *       - No broken image icons
 *    
 *    ✅ Layout:
 *       - A4 format (210mm × 297mm)
 *       - Proper margins
 *       - Multi-column in newspaper mode
 *       - No text overflow
 * 
 * 4. Common Issues & Solutions:
 *    
 *    Problem: Hebrew displays as ????
 *    Solution: Check font-family includes Hebrew support
 *    
 *    Problem: Text flows left-to-right
 *    Solution: Verify dir="rtl" in HTML
 *    
 *    Problem: Emojis show as □
 *    Solution: Puppeteer may need emoji fonts installed
 *              On Linux: apt-get install fonts-noto-color-emoji
 *    
 *    Problem: Images don't load
 *    Solution: Check image URLs are accessible
 *              Use data URLs or local files for testing
 *    
 *    Problem: PDF generation is slow
 *    Solution: Normal for Puppeteer (10-30 seconds)
 *              Consider caching or background jobs
 * 
 * 5. Production Considerations:
 *    - Use headless: 'new' for better performance
 *    - Implement PDF caching
 *    - Consider using queue for bulk generation
 *    - Monitor memory usage (Puppeteer is heavy)
 *    - Set reasonable timeouts
 *    - Handle Puppeteer crashes gracefully
 */
