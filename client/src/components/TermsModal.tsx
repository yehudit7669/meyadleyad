import React from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#3f504f]" style={{ fontFamily: 'Assistant, sans-serif' }}>
            תנאי שימוש ומדיניות פרטיות
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 space-y-6 text-[#3f504f]" style={{ fontFamily: 'Assistant, sans-serif' }}>
          <section className="space-y-3">
            <p className="text-lg leading-relaxed">
              ברוכים הבאים לאתר "המקום" (להלן: "האתר" או "הפלטפורמה").
            </p>
            <p className="text-lg leading-relaxed">
              האתר מהווה פלטפורמה דיגיטלית מתקדמת לפרסום ושיווק נכסי נדל״ן, פרויקטים, יזמים ונותני שירות בתחום הנדל״ן.
            </p>
            <p className="text-lg leading-relaxed font-semibold">
              השימוש באתר כפוף לתנאים המפורטים להלן.
            </p>
            <p className="text-lg leading-relaxed font-semibold">
              שימוש באתר מהווה הסכמה מלאה לתנאים אלו.
            </p>
          </section>

          <div className="border-t-2 border-[#3f504f] my-6"></div>

          <h3 className="text-2xl font-bold">חלק א': תנאי שימוש</h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-bold mb-2">1. מהות השירות</h4>
              <p className="leading-relaxed">האתר מספק פלטפורמה לפרסום נכסים, קבלת פניות, הפצת מודעות, וניהול מידע בתחום הנדל״ן.</p>
              <p className="leading-relaxed">האתר משמש כמתווך טכנולוגי בלבד ואינו צד לכל עסקה המתבצעת בין משתמשים.</p>
              <p className="leading-relaxed">האתר אינו מעניק שירותי תיווך ואינו מתחייב להשלמת עסקה כלשהי.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">2. אחריות לתוכן המפורסם</h4>
              <p className="leading-relaxed">האחריות הבלעדית לתוכן המודעות, התמונות, המחירים, הנתונים והמצגים חלה על המפרסם בלבד.</p>
              <p className="leading-relaxed">האתר אינו מתחייב לנכונות המידע ואינו נושא באחריות לנזק, ישיר או עקיף, הנובע מהסתמכות על תוכן שפורסם.</p>
              <p className="leading-relaxed">האתר רשאי להסיר תוכן שאינו עומד בסטנדרטים המקצועיים או בתנאי השימוש.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">3. כללי שימוש והתנהגות אסורה</h4>
              <p className="leading-relaxed font-semibold">אין לעשות שימוש באתר לצורך:</p>
              <ul className="mr-6 space-y-1 leading-relaxed">
                <li>• העלאת תוכן בלתי חוקי, מטעה או פוגעני</li>
                <li>• הפרת זכויות יוצרים או פרטיות</li>
                <li>• ניסיון חדירה למערכת</li>
                <li>• שימוש אוטומטי (Bots / Scraping)</li>
                <li>• פגיעה בפעילות התקינה של האתר</li>
              </ul>
              <p className="leading-relaxed">האתר רשאי להשעות או לחסום משתמש לפי שיקול דעתו.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">4. פרסום מודעות ושירותים</h4>
              <p className="leading-relaxed font-semibold">האתר רשאי לקבוע:</p>
              <ul className="mr-6 space-y-1 leading-relaxed">
                <li>• מגבלות משך פרסום</li>
                <li>• מיקום מודעה</li>
                <li>• קטגוריות פרסום</li>
                <li>• תנאי חשיפה והפצה</li>
                <li>• מחיקה בעל עת של משתמש ומודעות</li>
              </ul>
              <p className="leading-relaxed">האתר אינו מתחייב למספר צפיות, פניות או לידים.</p>
              <p className="leading-relaxed">תוצאות עסקיות תלויות בגורמי שוק שאינם בשליטת האתר.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">5. הפצה באמצעות ווטסאפ ופלטפורמות חיצוניות</h4>
              <p className="leading-relaxed">הפצת מודעות עשויה להתבצע באמצעות מערכות צד שלישי, לרבות WhatsApp Business, מערכות דיוור או פלטפורמות חיצוניות.</p>
              <p className="leading-relaxed">האתר אינו מתחייב למסירה בפועל, לחשיפה מלאה או לזמינות רציפה של שירותי צד שלישי.</p>
              <p className="leading-relaxed">לא תעמוד למשתמש כל טענה בגין תקלה טכנית, חסימה או מגבלה מצד ספק חיצוני.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">6. שירותים בתשלום</h4>
              <p className="leading-relaxed">האתר רשאי לקבוע כי שירותים מסוימים יהיו כרוכים בתשלום, לרבות:</p>
              <ul className="mr-6 space-y-1 leading-relaxed">
                <li>• פרסום מודעות</li>
                <li>• קידום והבלטה</li>
                <li>• שירותי חשיפה והפצה</li>
                <li>• כלים מתקדמים ליזמים ומתווכים</li>
              </ul>
              <p className="leading-relaxed">המחירים והתנאים יוצגו טרם ביצוע פעולה מחייבת.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">7. שינוי תנאים ושירותים</h4>
              <p className="leading-relaxed">האתר רשאי לעדכן או לשנות את תנאי השימוש בכל עת.</p>
              <p className="leading-relaxed">המשך שימוש באתר לאחר עדכון מהווה הסכמה לתנאים המעודכנים.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">8. קניין רוחני</h4>
              <p className="leading-relaxed">כל זכויות הקניין הרוחני באתר, לרבות עיצוב, קוד, לוגו, מיתוג ותוכן – שייכות לבעלי האתר.</p>
              <p className="leading-relaxed">אין להעתיק, לשכפל או להשתמש בתוכן האתר ללא אישור מראש ובכתב.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">9. הגבלת אחריות</h4>
              <p className="leading-relaxed">השימוש באתר נעשה על בסיס "As Is".</p>
              <p className="leading-relaxed">האתר אינו מתחייב לזמינות רציפה, לפעילות ללא תקלות או לדיוק מלא של הנתונים.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">10. סמכות שיפוט</h4>
              <p className="leading-relaxed">על תנאים אלו יחולו דיני מדינת ישראל בלבד.</p>
              <p className="leading-relaxed">סמכות השיפוט הבלעדית תהא בבתי המשפט המוסמכים בישראל.</p>
            </div>
          </div>

          <div className="border-t-2 border-[#3f504f] my-6"></div>

          <h3 className="text-2xl font-bold">חלק ב': מדיניות פרטיות</h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-bold mb-2">11. איסוף מידע</h4>
              <p className="leading-relaxed font-semibold">האתר עשוי לאסוף מידע אישי בעת:</p>
              <ul className="mr-6 space-y-1 leading-relaxed">
                <li>• פרסום נכס</li>
                <li>• יצירת קשר</li>
                <li>• הרשמה לדיוור</li>
                <li>• שימוש בדשבורד</li>
              </ul>
              <p className="leading-relaxed">המידע עשוי לכלול: שם, טלפון, דוא״ל, פרטי נכס, כתובת IP ומידע טכני.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">12. מטרות השימוש במידע</h4>
              <p className="leading-relaxed font-semibold">המידע ישמש לצורך:</p>
              <ul className="mr-6 space-y-1 leading-relaxed">
                <li>• תפעול האתר</li>
                <li>• פרסום והפצת מודעות</li>
                <li>• יצירת קשר בין צדדים</li>
                <li>• שליחת גיליונות ועדכונים</li>
                <li>• ניתוח ושיפור השירות</li>
                <li>• מניעת הונאות</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">13. לוגים וניטור פעילות</h4>
              <p className="leading-relaxed">האתר שומר לוגים ותיעוד פעילות לצרכי אבטחה ותפעול, לרבות:</p>
              <ul className="mr-6 space-y-1 leading-relaxed">
                <li>• זמני כניסה</li>
                <li>• פעולות מערכת</li>
                <li>• תיעוד פעולות מנהל</li>
                <li>• ניסיונות התחברות</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">14. העלאת מדיה</h4>
              <p className="leading-relaxed">בהעלאת תמונות או קבצים, המשתמש מצהיר כי הוא בעל הזכויות או מחזיק ברישיון מתאים.</p>
              <p className="leading-relaxed">האחריות לתוכן המועלה חלה על המשתמש בלבד.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">15. עיבוד מידע באמצעות שירותים חיצוניים</h4>
              <p className="leading-relaxed">המידע עשוי להיות מעובד באמצעות ספקי שירות חיצוניים, לרבות:</p>
              <ul className="mr-6 space-y-1 leading-relaxed">
                <li>• אחסון ענן</li>
                <li>• מערכות דיוור</li>
                <li>• מערכות WhatsApp Business</li>
                <li>• שירותי אנליטיקה</li>
                <li>• שירותי API טכנולוגיים</li>
              </ul>
              <p className="leading-relaxed">ייתכן שהמידע יישמר גם מחוץ לישראל, בהתאם לדין.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">16. העברת מידע לצדדים שלישיים</h4>
              <p className="leading-relaxed">האתר עשוי להעביר מידע אישי לצדדים שלישיים לצורך:</p>
              <ul className="mr-6 space-y-1 leading-relaxed">
                <li>• תפעול השירות</li>
                <li>• יצירת קשר בין מפרסם למתעניין</li>
                <li>• שיתופי פעולה עסקיים</li>
                <li>• מיזוג או מכירת פעילות</li>
                <li>• דרישה חוקית</li>
              </ul>
              <p className="leading-relaxed">העברה תיעשה במידת הצורך בלבד.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">17. מחיקה וחסימת חשבונות</h4>
              <p className="leading-relaxed">האתר רשאי לחסום משתמש במקרה של הפרת תנאים או שימוש לרעה.</p>
              <p className="leading-relaxed">האתר רשאי לשמור מידע לצרכי תיעוד, הגנה משפטית ועמידה בדין.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">18. מחיקה והסרת חשבון למפרסמים</h4>
              <p className="leading-relaxed">מפרסמים אשר ביצעו רישום או פרסום נכס באמצעות כתובת דוא״ל בלבד, יוכלו לבקש מחיקה או הסרת חשבון אך ורק באמצעות המנגנונים הייעודיים באתר.</p>
              <p className="leading-relaxed">בקשות למחיקה או להסרת חשבון לא יטופלו באמצעות פנייה בדוא״ל, הודעות ווטסאפ או כל ערוץ חיצוני אחר, אלא דרך הממשק הרשמי באתר בלבד.</p>
              <p className="leading-relaxed">המחיקה תתבצע בהתאם למדיניות שמירת המידע של האתר, ובכפוף לחובות משפטיות, תיעוד עסקאות, מניעת הונאה והגנה משפטית.</p>
              <p className="leading-relaxed">האתר רשאי לאמת את זהות המבקש טרם ביצוע מחיקה.</p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">19. שמירת מידע</h4>
              <p className="leading-relaxed">המידע יישמר כל עוד הוא נדרש לצורך תפעול האתר או בהתאם לדין.</p>
              <p className="leading-relaxed">משתמש רשאי לבקש עיון, תיקון או מחיקה של מידע בכפוף לחוק.</p>
            </div>
          </div>

          <div className="border-t border-gray-300 mt-6 pt-4">
            <p className="text-center font-semibold" dir="ltr">
              עודכן לאחרונה: 25.02.2026
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-center">
          <button
            onClick={onClose}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
