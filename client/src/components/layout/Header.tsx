import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import CategoryWithCities from './CategoryWithCities';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  return (
    <header className="bg-[#1F3F3A] shadow-md sticky top-0 z-50" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left Side (RTL) - Logo */}
          <Link 
            to="/" 
            aria-label="מיעדליעד - חזרה לדף הבית"
            className="flex items-center space-x-2 space-x-reverse"
          >
            <span className="text-2xl font-bold text-[#E6D3A3]">מיעדליעד</span>
          </Link>

          {/* Center - Navigation Categories */}
          <nav className="hidden md:flex items-center space-x-8 space-x-reverse" aria-label="ניווט ראשי">
            <CategoryWithCities 
              categorySlug="apartments-for-sale"
              categoryName="דירות למכירה"
            />
            <CategoryWithCities 
              categorySlug="apartments-for-rent"
              categoryName="דירות להשכרה"
            />
            <CategoryWithCities 
              categorySlug="commercial-real-estate"
              categoryName='נדל״ן מסחרי'
            />
            <CategoryWithCities 
              categorySlug="second-hand-board"
              categoryName="לוח יד שניה"
            />
          </nav>

          {/* Right Side (RTL) - Actions */}
          <div className="hidden md:flex items-center space-x-4 space-x-reverse">
            {user ? (
              <>
                <Link 
                  to="/publish" 
                  className="bg-[#C9A24D] text-[#1F3F3A] px-6 py-2 rounded-lg font-semibold hover:bg-[#B08C3C] transition focus-visible:ring-2 focus-visible:ring-[#C9A24D] focus-visible:ring-offset-2"
                  role="button"
                  aria-label="פרסום מודעה חדשה"
                >
                  פרסום חדש
                </Link>
                <div className="relative" ref={profileMenuRef}>
                  <button 
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    aria-label="תפריט משתמש"
                    aria-haspopup="true"
                    aria-expanded={profileMenuOpen}
                    className="flex items-center space-x-2 space-x-reverse text-[#E6D3A3] hover:text-[#C9A24D] transition focus-visible:ring-2 focus-visible:ring-[#C9A24D] rounded-full"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || user.email} className="w-10 h-10 rounded-full ring-2 ring-[#C9A24D]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#C9A24D] text-[#1F3F3A] flex items-center justify-center font-bold text-lg ring-2 ring-[#C9A24D]">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link
                        to={user.role === 'BROKER' ? '/broker/my-profile' : '/profile'}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        הפרופיל שלי
                      </Link>
                      <Link
                        to="/profile/ads"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        המודעות שלי
                      </Link>
                      {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR') && (
                        <Link 
                          to="/admin" 
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          ניהול
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleLogout();
                        }}
                        aria-label="התנתק מהמערכת"
                        className="block w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        התנתק
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-[#E6D3A3] hover:text-[#C9A24D] transition font-medium"
                >
                  התחבר
                </Link>
                <Link 
                  to="/register" 
                  className="bg-[#C9A24D] text-[#1F3F3A] px-6 py-2 rounded-lg font-semibold hover:bg-[#B08C3C] transition focus-visible:ring-2 focus-visible:ring-[#C9A24D] focus-visible:ring-offset-2"
                >
                  הירשם
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-[#E6D3A3] hover:text-[#C9A24D] focus-visible:ring-2 focus-visible:ring-[#C9A24D] rounded"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "סגור תפריט" : "פתח תפריט"}
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#C9A24D]/30 bg-[#1F3F3A]">
            <nav className="flex flex-col space-y-4">
              {/* Categories */}
              <div className="border-b border-[#C9A24D]/30 pb-4">
                <p className="text-xs text-[#C9A24D] mb-3 font-semibold px-2">קטגוריות</p>
                <CategoryWithCities 
                  categorySlug="apartments-for-sale"
                  categoryName="🏠 דירות למכירה"
                  isMobile={true}
                />
                <CategoryWithCities 
                  categorySlug="apartments-for-rent"
                  categoryName="🔑 דירות להשכרה"
                  isMobile={true}
                />
                <CategoryWithCities 
                  categorySlug="commercial-real-estate"
                  categoryName='🏢 נדל״ן מסחרי'
                  isMobile={true}
                />
                <CategoryWithCities 
                  categorySlug="second-hand-board"
                  categoryName="🛍️ לוח יד שניה"
                  isMobile={true}
                />
              </div>
              
              {user ? (
                <>
                  <Link 
                    to="/publish" 
                    className="bg-[#C9A24D] text-[#1F3F3A] py-3 px-4 rounded-lg font-semibold hover:bg-[#B08C3C] transition text-center"
                  >
                    פרסום חדש
                  </Link>
                  <Link to="/profile/ads" className="text-[#E6D3A3] hover:text-[#C9A24D] px-2 py-2 transition">
                    המודעות שלי
                  </Link>
                  <Link to="/profile" className="text-[#E6D3A3] hover:text-[#C9A24D] px-2 py-2 transition">
                    הפרופיל שלי
                  </Link>
                  {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR') && (
                    <Link to="/admin" className="text-[#E6D3A3] hover:text-[#C9A24D] px-2 py-2 transition">
                      ניהול
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    aria-label="התנתק מהמערכת"
                    className="text-right text-[#E6D3A3] hover:text-[#C9A24D] px-2 py-2 transition"
                  >
                    התנתק
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-[#E6D3A3] hover:text-[#C9A24D] px-2 py-2 transition">
                    התחבר
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-[#C9A24D] text-[#1F3F3A] py-3 px-4 rounded-lg font-semibold hover:bg-[#B08C3C] transition text-center"
                  >
                    הירשם
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
