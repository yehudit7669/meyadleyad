import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">אודות מיעד ליעד</h3>
            <p className="text-gray-400 text-sm">
              פלטפורמה מובילה לנדל״ן לבני הציבור החרדי. נכסים למכירה ולהשכרה, דירות לשבת וחגים, פרויקטים חדשים וכל סוגי הנדל״ן המותאמים למגזר החרדי.
            </p>
          </div>

          {/* Categories */}
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">קטגוריות</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/category/apartments-for-sale" className="text-gray-400 hover:text-white transition">
                  דירות למכירה
                </Link>
              </li>
              <li>
                <Link to="/category/apartments-for-rent" className="text-gray-400 hover:text-white transition">
                  דירות להשכרה
                </Link>
              </li>
              <li>
                <Link to="/category/commercial-real-estate" className="text-gray-400 hover:text-white transition">
                  נדל״ן מסחרי
                </Link>
              </li>
              <li>
                <Link to="/category/second-hand-board" className="text-gray-400 hover:text-white transition">
                  לוח יד שניה
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">משפטי</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/our-story" className="text-gray-400 hover:text-white transition">
                  הסיפור שלנו
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white transition">
                  שאלות נפוצות
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition">
                  תקנון האתר ותנאי שימוש
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition">
                  מדיניות פרטיות
                </Link>
              </li>
              <li>
                <Link to="/accessibility" className="text-gray-400 hover:text-white transition">
                  הסדרי נגישות
                </Link>
              </li>
              <li>
                <Link to="/business-login" className="text-gray-400 hover:text-white transition">
                  כניסה לעסקים
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">צור קשר</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📧 info@meyadleyad.com</li>
              <li>📱 050-123-4567</li>
              <li>📍 תל אביב, ישראל</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} מיעדליעד. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
