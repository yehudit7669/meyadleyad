import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Link to="/" className="text-primary-600 hover:underline mb-4 inline-block">
            ← חזרה לדף הבית
          </Link>
          
          <h1 className="text-3xl font-bold mb-6">תנאי שימוש</h1>
          
          <div className="space-y-4 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-2">1. כללי</h2>
              <p>
                ברוכים הבאים לאתר מיועדלי עד. השימוש באתר מהווה הסכמה לתנאי שימוש אלו.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">2. שימוש באתר</h2>
              <p>
                המשתמש מתחייב להשתמש באתר למטרות חוקיות בלבד ולא לפרסם תוכן פוגעני, מטעה או בלתי חוקי.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">3. אחריות המשתמש</h2>
              <p>
                המשתמש אחראי לכל פעולה המתבצעת תחת חשבונו ומתחייב לשמור על סודיות פרטי ההתחברות שלו.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">4. הגבלת אחריות</h2>
              <p>
                האתר אינו אחראי לנזקים כלשהם הנובעים משימוש באתר או מהסתמכות על תוכן המופיע בו.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">5. שינויים בתנאי השימוש</h2>
              <p>
                האתר שומר לעצמו את הזכות לשנות את תנאי השימוש מעת לעת ללא הודעה מוקדמת.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">6. יצירת קשר</h2>
              <p>
                לשאלות או הבהרות ניתן ליצור קשר דרך טופס יצירת הקשר באתר.
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

export default Terms;
