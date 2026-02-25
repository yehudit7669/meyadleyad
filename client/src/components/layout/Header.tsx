import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUserNotifications } from '../../contexts/UserNotificationsContext';
import { useAdminNotifications } from '../../contexts/AdminNotificationsContext';
import { useDropdownA11y } from '../../hooks/useDropdownA11y';
import CategoryWithCities from './CategoryWithCities';
import ContactModal from '../ContactModal';
import { MessageCircle, Bell } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount: userUnreadCount } = useUserNotifications();
  const { unreadCount: adminUnreadCount } = useAdminNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Profile menu dropdown accessibility
  const profileMenuItems = user ? (
    user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR' ? 3 : 2
  ) : 0;

  const { 
    triggerRef: profileTriggerRef, 
    menuRef: profileMenuDropdownRef, 
    handleTriggerKeyDown: handleProfileTriggerKeyDown, 
    handleMenuKeyDown: handleProfileMenuKeyDown 
  } = useDropdownA11y({
    isOpen: profileMenuOpen,
    onToggle: setProfileMenuOpen,
    itemCount: profileMenuItems,
    closeOnSelect: true,
  });

  // Use admin count for admins, user count for regular users
  const unreadCount = user?.isAdmin ? adminUnreadCount : userUnreadCount;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Close mobile menu when clicking on a link
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
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
    <header className="bg-white shadow-md sticky top-0 z-50" dir="rtl">
      <div className="w-full px-0">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Right Side (RTL) - Logo */}
          <Link 
            to="/" 
            aria-label="המקום - חזרה לדף הבית"
            className="flex items-center space-x-2 space-x-reverse"
          >
            <img 
              src="/images/amakom.jpg" 
              alt="המקום" 
              style={{ height: '130px' }}
              className="w-auto object-contain"
            />
          </Link>

          {/* Center - Navigation Categories */}
          <nav className="hidden md:flex items-center space-x-8 space-x-reverse flex-1 justify-center" aria-label="ניווט ראשי">
            <CategoryWithCities 
              categorySlug="apartments-for-sale"
              categoryName="דירות למכירה"
            />
            <CategoryWithCities 
              categorySlug="apartments-for-rent"
              categoryName="דירות להשכרה"
            />
            <CategoryWithCities 
              categorySlug="shared-tabu"
              categoryName="טאבו משותף"
            />
            <CategoryWithCities 
              categorySlug="commercial-real-estate"
              categoryName='נדל״ן מסחרי'
            />
            <CategoryWithCities 
              categorySlug="housing-units"
              categoryName="יחידות דיור"
            />
            <CategoryWithCities 
              categorySlug="projects"
              categoryName="פרויקטים"
            />
            <Link
              to="/service-providers"
              className="text-[#3f504f] hover:text-[#2f403f] transition font-bold"
              style={{ fontFamily: 'Assistant, sans-serif' }}
            >
              נותני שירות
            </Link>
            <Link
              to="/brokers"
              className="text-[#3f504f] hover:text-[#2f403f] transition font-bold"
              style={{ fontFamily: 'Assistant, sans-serif' }}
            >
              מתווכים
            </Link>
            <Link
              to="/wanted"
              className="text-[#3f504f] hover:text-[#2f403f] transition font-bold"
              style={{ fontFamily: 'Assistant, sans-serif' }}
            >
              דרושים
            </Link>
          </nav>

          {/* Left Side (RTL) - Actions */}
          <div className="hidden md:flex items-center space-x-4 space-x-reverse">
            {/* Contact Button */}
            <button
              onClick={() => setContactModalOpen(true)}
              className="text-[#3f504f] hover:text-[#2f403f] transition font-medium flex items-center space-x-1 space-x-reverse"
              aria-label="יצירת קשר"
            >
              <MessageCircle className="w-5 h-5" />
              <span>יצירת קשר</span>
            </button>

            {user ? (
              <>
                {/* Support Notifications Bell */}
                <Link
                  to={user.isAdmin ? '/admin/conversations' : '/my-conversations'}
                  className="relative text-[#3f504f] hover:text-[#2f403f] transition"
                  aria-label="הודעות תמיכה"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <Link 
                  to="/publish" 
                  className="bg-[#3f504f] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#2f403f] transition focus-visible:ring-2 focus-visible:ring-[#3f504f] focus-visible:ring-offset-2"
                  role="button"
                  aria-label="פרסום מודעה חדשה"
                >
                  פרסום חדש
                </Link>
                <div className="relative" ref={profileMenuRef}>
                  <button 
                    ref={profileTriggerRef as React.RefObject<HTMLButtonElement>}
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    onKeyDown={handleProfileTriggerKeyDown}
                    aria-label="תפריט משתמש"
                    aria-haspopup="menu"
                    aria-expanded={profileMenuOpen}
                    aria-controls="profile-menu"
                    className="flex items-center space-x-2 space-x-reverse text-[#E6D3A3] hover:text-[#C9A24D] transition focus-visible:ring-2 focus-visible:ring-[#C9A24D] rounded-full"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || user.email} className="w-10 h-10 rounded-full ring-2 ring-[#3f504f]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#3f504f] text-white flex items-center justify-center font-bold text-lg ring-2 ring-[#3f504f]">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  {profileMenuOpen && (
                    <div 
                      id="profile-menu"
                      ref={profileMenuDropdownRef as React.RefObject<HTMLDivElement>}
                      role="menu"
                      onKeyDown={handleProfileMenuKeyDown}
                      className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50"
                    >
                      <Link
                        to={user.role === 'BROKER' ? '/broker/my-profile' : '/profile'}
                        role="menuitem"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        הפרופיל שלי
                      </Link>
                      {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR') && (
                        <Link 
                          to="/admin" 
                          role="menuitem"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          ניהול
                        </Link>
                      )}
                      <button
                        role="menuitem"
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
                  className="text-[#3f504f] hover:text-[#2f403f] transition"
                >
                  התחבר
                </Link>
                <Link 
                  to="/register" 
                  className="bg-[#3f504f] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#2f403f] transition focus-visible:ring-2 focus-visible:ring-[#3f504f] focus-visible:ring-offset-2"
                >
                  הירשם
                </Link>
              </>
            )}
          </div>

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
                <div onClick={closeMobileMenu}>
                  <CategoryWithCities 
                    categorySlug="apartments-for-sale"
                    categoryName="🏠 דירות למכירה"
                    isMobile={true}
                  />
                </div>
                <div onClick={closeMobileMenu}>
                  <CategoryWithCities 
                    categorySlug="apartments-for-rent"
                    categoryName="🔑 דירות להשכרה"
                    isMobile={true}
                  />
                </div>
                <div onClick={closeMobileMenu}>
                  <CategoryWithCities 
                    categorySlug="shared-tabu"
                    categoryName="📋 טאבו משותף"
                    isMobile={true}
                  />
                </div>
                <div onClick={closeMobileMenu}>
                  <CategoryWithCities 
                    categorySlug="commercial-real-estate"
                    categoryName='🏢 נדל״ן מסחרי'
                    isMobile={true}
                  />
                </div>
                <div onClick={closeMobileMenu}>
                  <CategoryWithCities 
                    categorySlug="housing-units"
                    categoryName="🏘️ יחידות דיור"
                    isMobile={true}
                  />
                </div>
                <div onClick={closeMobileMenu}>
                  <CategoryWithCities 
                    categorySlug="projects"
                    categoryName="🏗️ פרויקטים"
                    isMobile={true}
                  />
                </div>
                <Link
                  to="/service-providers"
                  className="text-[#E6D3A3] hover:text-[#C9A24D] px-2 py-2 transition"
                  onClick={closeMobileMenu}
                >
                  🔧 נותני שירות
                </Link>
                <Link
                  to="/brokers"
                  className="text-[#E6D3A3] hover:text-[#C9A24D] px-2 py-2 transition"
                  onClick={closeMobileMenu}
                >
                  👔 מתווכים
                </Link>
                <Link
                  to="/wanted"
                  className="text-[#E6D3A3] hover:text-[#C9A24D] px-2 py-2 transition"
                  onClick={closeMobileMenu}
                >
                  🔍 דרושים
                </Link>
              </div>
              
              {user ? (
                <>
                  <Link 
                    to="/publish" 
                    className="bg-[#C9A24D] text-[#1F3F3A] py-3 px-4 rounded-lg font-semibold hover:bg-[#B08C3C] transition text-center"
                    onClick={closeMobileMenu}
                  >
                    פרסום חדש
                  </Link>
                  <Link 
                    to="/profile" 
                    className="text-[#E6D3A3] hover:text-[#C9A24D] px-2 py-2 transition"
                    onClick={closeMobileMenu}
                  >
                    הפרופיל שלי
                  </Link>
                  {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR') && (
                    <Link 
                      to="/admin" 
                      className="text-[#E6D3A3] hover:text-[#C9A24D] px-2 py-2 transition"
                      onClick={closeMobileMenu}
                    >
                      ניהול
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleLogout();
                    }}
                    aria-label="התנתק מהמערכת"
                    className="text-right text-[#E6D3A3] hover:text-[#C9A24D] px-2 py-2 transition"
                  >
                    התנתק
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-[#E6D3A3] hover:text-[#C9A24D] px-2 py-2 transition"
                    onClick={closeMobileMenu}
                  >
                    התחבר
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-[#C9A24D] text-[#1F3F3A] py-3 px-4 rounded-lg font-semibold hover:bg-[#B08C3C] transition text-center"
                    onClick={closeMobileMenu}
                  >
                    הירשם
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </header>
  );
};

export default Header;
