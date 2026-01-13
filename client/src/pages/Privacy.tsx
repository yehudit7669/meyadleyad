import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Link to="/" className="text-primary-600 hover:underline mb-4 inline-block">
            ← חזרה לדף הבית
          </Link>
          
          <h1 className="text-3xl font-bold mb-6">מדיניות פרטיות</h1>
          
          <div className="space-y-4 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-2">1. איסוף מידע</h2>
              <p>
                אנו אוספים מידע אישי שאתם מספקים בעת הרשמה לאתר, כגון שם, כתובת אימייל, ומספר טלפון.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">2. שימוש במידע</h2>
              <p>
                המידע שנאסף משמש לצורך:
              </p>
              <ul className="list-disc list-inside mr-4 mt-2 space-y-1">
                <li>אימות זהות משתמשים</li>
                <li>שיפור חוויית המשתמש באתר</li>
                <li>שליחת עדכונים והודעות רלוונטיות</li>
                <li>ניתוח ושיפור השירותים שלנו</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">3. אבטחת מידע</h2>
              <p>
                אנו נוקטים אמצעי אבטחה מתקדמים להגנה על המידע האישי שלכם, כולל הצפנה ושמירה מאובטחת.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">4. שיתוף מידע עם צדדים שלישיים</h2>
              <p>
                אנו לא נשתף את המידע האישי שלכם עם צדדים שלישיים ללא הסכמתכם, למעט במקרים הנדרשים על פי חוק.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">5. עוגיות (Cookies)</h2>
              <p>
                האתר משתמש בעוגיות לשיפור חוויית המשתמש. באפשרותכם לנהל את העדפות העוגיות דרך הדפדפן שלכם.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">6. זכויות המשתמש</h2>
              <p>
                יש לכם זכות לצפות, לעדכן או למחוק את המידע האישי שלכם בכל עת על ידי פניה אלינו.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">7. התחברות דרך Google</h2>
              <p>
                בעת שימוש בהתחברות דרך Google, אנו מקבלים מידע בסיסי מחשבון Google שלכם בהתאם למדיניות הפרטיות של Google.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">8. יצירת קשר</h2>
              <p>
                לשאלות או בקשות הנוגעות לפרטיותכם, אנא צרו קשר דרך טופס יצירת הקשר באתר.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              עדכון אחרון: ינואר 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
