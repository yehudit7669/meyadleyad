import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ContactModal from '../ContactModal';
import { MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  const [contactModalOpen, setContactModalOpen] = useState(false);

  return (
    <>
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">אודות המקום</h3>
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
                <Link to="/category/holiday-rentals" className="text-gray-400 hover:text-white transition">
                  דירות לשבת וחגים
                </Link>
              </li>
              <li>
                <Link to="/category/shared-ownership" className="text-gray-400 hover:text-white transition">
                  טאבו משותף
                </Link>
              </li>
              <li>
                <Link to="/category/commercial-real-estate" className="text-gray-400 hover:text-white transition">
                  נדל״ן מסחרי
                </Link>
              </li>
              <li>
                <Link to="/category/units" className="text-gray-400 hover:text-white transition">
                  יחידות דיור
                </Link>
              </li>
              <li>
                <Link to="/category/projects" className="text-gray-400 hover:text-white transition">
                  פרויקטים
                </Link>
              </li>
              <li>
                <Link to="/category/service-providers" className="text-gray-400 hover:text-white transition">
                  נותני שירות
                </Link>
              </li>
              <li>
                <Link to="/category/wanted" className="text-gray-400 hover:text-white transition">
                  דרושים
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
              <li>📧 publish@amakom.co.il</li>
              <li>📱 050-123-4567</li>
              <li>📍 תל אביב, ישראל</li>
              <li className="pt-2">
                <button
                  onClick={() => setContactModalOpen(true)}
                  className="text-[#C9A24D] hover:text-[#E6D3A3] transition font-medium inline-flex items-center space-x-1 space-x-reverse"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>שלח לנו הודעה</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} המקום. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>

      {/* Contact Modal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </>
  );
};

export default Footer;
