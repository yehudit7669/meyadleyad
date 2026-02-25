import React from 'react';
import { Helmet } from 'react-helmet-async';

const Privacy: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>תנאי שימוש ומדיניות פרטיות - המקום</title>
        <meta name="description" content="תנאי שימוש ומדיניות פרטיות של המקום - פלטפורמה דיגיטלית לנדל״ן" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12" dir="rtl">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Logo Section */}
          <div className="flex justify-center mb-12">
            <img 
              src="/images/amakom.jpg" 
              alt="המקום" 
              style={{ height: '180px' }}
              className="w-auto object-contain"
            />
          </div>

          {/* Content Section */}
          <div 
            className="space-y-8 text-[#3f504f]" 
            style={{ fontFamily: 'Assistant, sans-serif' }}
          >
            {/* Main Title */}
            <section className="text-center space-y-4 mb-12">
              <h1 className="text-4xl font-bold mb-6">תנאי שימוש ומדיניות פרטיות</h1>
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

            <div className="border-t-2 border-[#3f504f] my-12"></div>

            {/* Part A: Terms of Use */}
            <section className="space-y-8 ">
              <h2 className="text-3xl font-bold mb-8">חלק א': תנאי שימוש</h2>

              {/* Section 1 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">1. מהות השירות</h3>
                <p className="text-lg leading-relaxed">
                  האתר מספק פלטפורמה לפרסום נכסים, קבלת פניות, הפצת מודעות, וניהול מידע בתחום הנדל״ן.
                </p>
                <p className="text-lg leading-relaxed">
                  האתר משמש כמתווך טכנולוגי בלבד ואינו צד לכל עסקה המתבצעת בין משתמשים.
                </p>
                <p className="text-lg leading-relaxed">
                  האתר אינו מעניק שירותי תיווך ואינו מתחייב להשלמת עסקה כלשהי.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">2. אחריות לתוכן המפורסם</h3>
                <p className="text-lg leading-relaxed">
                  האחריות הבלעדית לתוכן המודעות, התמונות, המחירים, הנתונים והמצגים חלה על המפרסם בלבד.
                </p>
                <p className="text-lg leading-relaxed">
                  האתר אינו מתחייב לנכונות המידע ואינו נושא באחריות לנזק, ישיר או עקיף, הנובע מהסתמכות על תוכן שפורסם.
                </p>
                <p className="text-lg leading-relaxed">
                  האתר רשאי להסיר תוכן שאינו עומד בסטנדרטים המקצועיים או בתנאי השימוש.
                </p>
              </div>

              {/* Section 3 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">3. כללי שימוש והתנהגות אסורה</h3>
                <p className="text-lg leading-relaxed font-semibold">אין לעשות שימוש באתר לצורך:</p>
                <div className="flex">
                  <ul className="space-y-2 text-lg text-right inline-block">
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>העלאת תוכן בלתי חוקי, מטעה או פוגעני</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>הפרת זכויות יוצרים או פרטיות</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>ניסיון חדירה למערכת</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>שימוש אוטומטי (Bots / Scraping)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>פגיעה בפעילות התקינה של האתר</span>
                    </li>
                  </ul>
                </div>
                <p className="text-lg leading-relaxed">
                  האתר רשאי להשעות או לחסום משתמש לפי שיקול דעתו.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">4. פרסום מודעות ושירותים</h3>
                <p className="text-lg leading-relaxed font-semibold">האתר רשאי לקבוע:</p>
                <div className="flex">
                  <ul className="space-y-2 text-lg text-right inline-block">
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>מגבלות משך פרסום</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>מיקום מודעה</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>קטגוריות פרסום</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>תנאי חשיפה והפצה</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>מחיקה בעל עת של משתמש ומודעות</span>
                    </li>
                  </ul>
                </div>
                <p className="text-lg leading-relaxed">
                  האתר אינו מתחייב למספר צפיות, פניות או לידים.
                </p>
                <p className="text-lg leading-relaxed">
                  תוצאות עסקיות תלויות בגורמי שוק שאינם בשליטת האתר.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">5. הפצה באמצעות ווטסאפ ופלטפורמות חיצוניות</h3>
                <p className="text-lg leading-relaxed">
                  הפצת מודעות עשויה להתבצע באמצעות מערכות צד שלישי, לרבות WhatsApp Business, מערכות דיוור או פלטפורמות חיצוניות.
                </p>
                <p className="text-lg leading-relaxed">
                  האתר אינו מתחייב למסירה בפועל, לחשיפה מלאה או לזמינות רציפה של שירותי צד שלישי.
                </p>
                <p className="text-lg leading-relaxed">
                  לא תעמוד למשתמש כל טענה בגין תקלה טכנית, חסימה או מגבלה מצד ספק חיצוני.
                </p>
              </div>

              {/* Section 6 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">6. שירותים בתשלום</h3>
                <p className="text-lg leading-relaxed">
                  האתר רשאי לקבוע כי שירותים מסוימים יהיו כרוכים בתשלום, לרבות:
                </p>
                <div className="flex">
                  <ul className="space-y-2 text-lg text-right inline-block">
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>פרסום מודעות</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>קידום והבלטה</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>שירותי חשיפה והפצה</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>כלים מתקדמים ליזמים ומתווכים</span>
                    </li>
                  </ul>
                </div>
                <p className="text-lg leading-relaxed">
                  המחירים והתנאים יוצגו טרם ביצוע פעולה מחייבת.
                </p>
              </div>

              {/* Section 7 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">7. שינוי תנאים ושירותים</h3>
                <p className="text-lg leading-relaxed">
                  האתר רשאי לעדכן או לשנות את תנאי השימוש בכל עת.
                </p>
                <p className="text-lg leading-relaxed">
                  המשך שימוש באתר לאחר עדכון מהווה הסכמה לתנאים המעודכנים.
                </p>
              </div>

              {/* Section 8 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">8. קניין רוחני</h3>
                <p className="text-lg leading-relaxed">
                  כל זכויות הקניין הרוחני באתר, לרבות עיצוב, קוד, לוגו, מיתוג ותוכן – שייכות לבעלי האתר.
                </p>
                <p className="text-lg leading-relaxed">
                  אין להעתיק, לשכפל או להשתמש בתוכן האתר ללא אישור מראש ובכתב.
                </p>
              </div>

              {/* Section 9 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">9. הגבלת אחריות</h3>
                <p className="text-lg leading-relaxed">
                  השימוש באתר נעשה על בסיס "As Is".
                </p>
                <p className="text-lg leading-relaxed">
                  האתר אינו מתחייב לזמינות רציפה, לפעילות ללא תקלות או לדיוק מלא של הנתונים.
                </p>
              </div>

              {/* Section 10 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">10. סמכות שיפוט</h3>
                <p className="text-lg leading-relaxed">
                  על תנאים אלו יחולו דיני מדינת ישראל בלבד.
                </p>
                <p className="text-lg leading-relaxed">
                  סמכות השיפוט הבלעדית תהא בבתי המשפט המוסמכים בישראל.
                </p>
              </div>
            </section>

            <div className="border-t-2 border-[#3f504f] my-12"></div>

            {/* Part B: Privacy Policy */}
            <section className="space-y-8">
              <h2 className="text-3xl font-bold mb-8">חלק ב': מדיניות פרטיות</h2>

              {/* Section 11 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">11. איסוף מידע</h3>
                <p className="text-lg leading-relaxed font-semibold">
                  האתר עשוי לאסוף מידע אישי בעת:
                </p>
                <div className="flex">
                  <ul className="space-y-2 text-lg text-right inline-block">
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>פרסום נכס</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>יצירת קשר</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>הרשמה לדיוור</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>שימוש בדשבורד</span>
                    </li>
                  </ul>
                </div>
                <p className="text-lg leading-relaxed">
                  המידע עשוי לכלול: שם, טלפון, דוא״ל, פרטי נכס, כתובת IP ומידע טכני.
                </p>
              </div>

              {/* Section 12 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">12. מטרות השימוש במידע</h3>
                <p className="text-lg leading-relaxed font-semibold">המידע ישמש לצורך:</p>
                <div className="flex">
                  <ul className="space-y-2 text-lg text-right inline-block">
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>תפעול האתר</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>פרסום והפצת מודעות</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>יצירת קשר בין צדדים</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>שליחת גיליונות ועדכונים</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>ניתוח ושיפור השירות</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>מניעת הונאות</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Section 13 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">13. לוגים וניטור פעילות</h3>
                <p className="text-lg leading-relaxed">
                  האתר שומר לוגים ותיעוד פעילות לצרכי אבטחה ותפעול, לרבות:
                </p>
                <div className="flex">
                  <ul className="space-y-2 text-lg text-right inline-block">
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>זמני כניסה</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>פעולות מערכת</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>תיעוד פעולות מנהל</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>ניסיונות התחברות</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Section 14 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">14. העלאת מדיה</h3>
                <p className="text-lg leading-relaxed">
                  בהעלאת תמונות או קבצים, המשתמש מצהיר כי הוא בעל הזכויות או מחזיק ברישיון מתאים.
                </p>
                <p className="text-lg leading-relaxed">
                  האחריות לתוכן המועלה חלה על המשתמש בלבד.
                </p>
              </div>

              {/* Section 15 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">15. עיבוד מידע באמצעות שירותים חיצוניים</h3>
                <p className="text-lg leading-relaxed">
                  המידע עשוי להיות מעובד באמצעות ספקי שירות חיצוניים, לרבות:
                </p>
                <div className="flex">
                  <ul className="space-y-2 text-lg text-right inline-block">
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>אחסון ענן</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>מערכות דיוור</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>מערכות WhatsApp Business</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>שירותי אנליטיקה</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>שירותי API טכנולוגיים</span>
                    </li>
                  </ul>
                </div>
                <p className="text-lg leading-relaxed">
                  ייתכן שהמידע יישמר גם מחוץ לישראל, בהתאם לדין.
                </p>
              </div>

              {/* Section 16 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">16. העברת מידע לצדדים שלישיים</h3>
                <p className="text-lg leading-relaxed">
                  האתר עשוי להעביר מידע אישי לצדדים שלישיים לצורך:
                </p>
                <div className="flex">
                  <ul className="space-y-2 text-lg text-right inline-block">
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>תפעול השירות</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>יצירת קשר בין מפרסם למתעניין</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>שיתופי פעולה עסקיים</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>מיזוג או מכירת פעילות</span>
                    </li>
                    <li className="flex items-start">
                      <span className="ml-3">•</span>
                      <span>דרישה חוקית</span>
                    </li>
                  </ul>
                </div>
                <p className="text-lg leading-relaxed">
                  העברה תיעשה במידת הצורך בלבד.
                </p>
              </div>

              {/* Section 17 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">17. מחיקה וחסימת חשבונות</h3>
                <p className="text-lg leading-relaxed">
                  האתר רשאי לחסום משתמש במקרה של הפרת תנאים או שימוש לרעה.
                </p>
                <p className="text-lg leading-relaxed">
                  האתר רשאי לשמור מידע לצרכי תיעוד, הגנה משפטית ועמידה בדין.
                </p>
              </div>

              {/* Section 18 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">18. מחיקה והסרת חשבון למפרסמים</h3>
                <p className="text-lg leading-relaxed">
                  מפרסמים אשר ביצעו רישום או פרסום נכס באמצעות כתובת דוא״ל בלבד, יוכלו לבקש מחיקה או הסרת חשבון אך ורק באמצעות המנגנונים הייעודיים באתר.
                </p>
                <p className="text-lg leading-relaxed">
                  בקשות למחיקה או להסרת חשבון לא יטופלו באמצעות פנייה בדוא״ל, הודעות ווטסאפ או כל ערוץ חיצוני אחר, אלא דרך הממשק הרשמי באתר בלבד.
                </p>
                <p className="text-lg leading-relaxed">
                  המחיקה תתבצע בהתאם למדיניות שמירת המידע של האתר, ובכפוף לחובות משפטיות, תיעוד עסקאות, מניעת הונאה והגנה משפטית.
                </p>
                <p className="text-lg leading-relaxed">
                  האתר רשאי לאמת את זהות המבקש טרם ביצוע מחיקה.
                </p>
              </div>

              {/* Section 19 */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">19. שמירת מידע</h3>
                <p className="text-lg leading-relaxed">
                  המידע יישמר כל עוד הוא נדרש לצורך תפעול האתר או בהתאם לדין.
                </p>
                <p className="text-lg leading-relaxed">
                  משתמש רשאי לבקש עיון, תיקון או מחיקה של מידע בכפוף לחוק.
                </p>
              </div>
            </section>

            {/* Footer Section */}
            <div className="border-t border-gray-300 mt-12 pt-8">
              <p className="text-center text-lg font-semibold" dir="ltr">
                עודכן לאחרונה: 25.02.2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;
