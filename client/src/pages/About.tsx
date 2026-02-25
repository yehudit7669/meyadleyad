import React from 'react';
import { Helmet } from 'react-helmet-async';

const About: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>אודות - המקום</title>
        <meta name="description" content="המקום - פלטפורמה מרכזית לנדל״ן לציבור החרדי" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12" dir="rtl">
        <div className="container mx-auto px-4 max-w-4xl">
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
            {/* Opening Section */}
            <section className="text-center space-y-4">
              <p className="text-xl leading-relaxed">
                המקום הוקם מתוך הבנה עמוקה של הציבור החרדי –
              </p>
              <p className="text-xl leading-relaxed">
                קהילה גדולה, צומחת ומשפיעה, עם צרכים ייחודיים בעולם הנדל״ן ובעולם הדיגיטלי.
              </p>
              <p className="text-xl leading-relaxed">
                היום, יותר מתמיד, המידע עובר דרך מסכים.
              </p>
              <p className="text-xl leading-relaxed">
                קבוצות, רשימות תפוצה, אתרים, קבצים והודעות.
              </p>
              <p className="text-xl leading-relaxed">
                אך דווקא בעידן של שפע – חסר סדר.
              </p>
              <p className="text-xl leading-relaxed font-semibold">
                המקום נולד כדי ליצור מרכז אחד ברור, מכובד ומדויק.
              </p>
              <p className="text-xl leading-relaxed font-semibold">
                פלטפורמה שמרכזת את כל המידע הנדל״ני עבור הציבור החרדי — במקום אחד.
              </p>
            </section>

            <div className="border-t border-gray-300 my-8"></div>

            {/* Digital Understanding Section */}
            <section className="space-y-4 text-center">
              <h2 className="text-3xl font-bold mb-6">הבנה דיגיטלית אמיתית</h2>
              <p className="text-lg leading-relaxed">
                אנחנו מבינים את האופן שבו הציבור החרדי צורך מידע דיגיטלי:
              </p>
              <div className="flex justify-center">
                <ul className="space-y-3 text-lg text-right inline-block">
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>חשיפה מדורגת ומבוקרת</span>
                  </li>
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>שפה נקייה ומכובדת</span>
                  </li>
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>ממשק פשוט וברור</span>
                  </li>
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>נגישות דרך פלטפורמות מוכרות</span>
                  </li>
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>אמינות לפני מהירות</span>
                  </li>
                </ul>
              </div>
              <p className="text-lg leading-relaxed font-semibold">
                המקום נבנה מתוך ההיכרות הזו —
              </p>
              <p className="text-lg leading-relaxed">
                לא כהעתקה של מודל כללי, אלא כפלטפורמה מותאמת מהיסוד.
              </p>
            </section>

            <div className="border-t border-gray-300 my-8"></div>

            {/* Community Section */}
            <section className="space-y-4 text-center">
              <h2 className="text-3xl font-bold mb-6">קהילה גדולה. מרכז אחד.</h2>
              <p className="text-lg leading-relaxed">
                הציבור החרדי הוא אחת הקהילות הגדולות והמשמעותיות בישראל.
              </p>
              <p className="text-lg leading-relaxed">
                היקף העסקאות, הפרויקטים והביקוש רק הולך וגדל.
              </p>
              <p className="text-lg leading-relaxed font-semibold">
                הגיע הזמן למסגרת אחת:
              </p>
              <div className="flex justify-center">
                <ul className="space-y-3 text-lg text-right inline-block">
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>דירות למכירה ולהשכרה</span>
                  </li>
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>פרויקטים חדשים של יזמים</span>
                  </li>
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>נכסי השקעה</span>
                  </li>
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>דירות לשבתות וחגים</span>
                  </li>
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>נותני שירות מקצועיים</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2 mt-6">
                <p className="text-xl font-bold">מערכת אחת.</p>
                <p className="text-xl font-bold">שפה אחת.</p>
                <p className="text-xl font-bold">רמה אחת.</p>
              </div>
            </section>

            <div className="border-t border-gray-300 my-8"></div>

            {/* Quality Section */}
            <section className="space-y-4 text-center">
              <h2 className="text-3xl font-bold mb-6">יוקרה שקטה. דיוק אמיתי.</h2>
              <p className="text-lg leading-relaxed">
                המקום איננו עוד לוח מודעות.
              </p>
              <p className="text-lg leading-relaxed font-semibold">
                הוא מותג נדל״ן.
              </p>
              <div className="flex justify-center">
                <ul className="space-y-3 text-lg text-right inline-block">
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>הצגה אסתטית ומוקפדת</span>
                  </li>
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>סינון מודעות</span>
                  </li>
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>חוויית שימוש נקייה ושקטה</span>
                  </li>
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>גיליונות מסודרים וברורים</span>
                  </li>
                  <li className="flex items-start">
                    <span className="ml-3 text-2xl">•</span>
                    <span>זהות מותג אלגנטית ומכובדת</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 space-y-2">
                <p className="text-lg leading-relaxed">
                  אנחנו מאמינים שיוקרה איננה רעש.
                </p>
                <p className="text-lg leading-relaxed font-semibold">היא סדר.</p>
                <p className="text-lg leading-relaxed font-semibold">היא בהירות.</p>
                <p className="text-lg leading-relaxed font-semibold">היא אמון.</p>
              </div>
            </section>

            <div className="border-t border-gray-300 my-8"></div>

            {/* Vision Section */}
            <section className="space-y-4 mb-12">
              <h2 className="text-3xl font-bold text-center mb-6">החזון</h2>
              <p className="text-xl leading-relaxed text-center font-semibold">
                לבנות את הבית הדיגיטלי המרכזי של עולם הנדל״ן החרדי —
              </p>
              <p className="text-xl leading-relaxed text-center">
                כזה שמכבד את הערכים, מבין את התרבות, ומשלב טכנולוגיה מתקדמת עם אחריות ודיוק.
              </p>
              <p className="text-xl leading-relaxed text-center font-semibold">
                מקום שבו משפחות, יזמים ונותני שירות נפגשים — במסגרת אחת ברורה ומכובדת.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
