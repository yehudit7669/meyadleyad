import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Clock,
  FileText,
  Newspaper,
  Users,
  Calendar,
  Mail,
  ImageIcon,
  Download,
  FileCheck,
  HardDrive,
  Settings,
  Menu,
  X
} from 'lucide-react';

interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: React.ReactNode;
  requiredRoles: ('ADMIN' | 'SUPER_ADMIN' | 'MODERATOR')[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'דשבורד מנהל',
    path: '/admin/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']
  },
  {
    id: 'pending',
    title: 'מודעות בהמתנה',
    path: '/admin/pending',
    icon: <Clock className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']
  },
  {
    id: 'ads',
    title: 'ניהול מודעות',
    path: '/admin/ads',
    icon: <FileText className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']
  },
  {
    id: 'newspaper',
    title: 'לוח מודעות – תצורת עיתון',
    path: '/admin/newspaper',
    icon: <Newspaper className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    id: 'users',
    title: 'ניהול משתמשים',
    path: '/admin/users',
    icon: <Users className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']
  },
  {
    id: 'appointments',
    title: 'תיאומי פגישות',
    path: '/admin/appointments',
    icon: <Calendar className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']
  },
  {
    id: 'content',
    title: 'ניהול תוכן / תפוצה',
    path: '/admin/content',
    icon: <Mail className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    id: 'branding',
    title: 'ניהול מדיה ומיתוג',
    path: '/admin/branding',
    icon: <ImageIcon className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    id: 'imports',
    title: 'ייבוא ונתונים חיצוניים',
    path: '/admin/imports',
    icon: <Download className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    id: 'audit',
    title: 'לוג פעולות ניהול',
    path: '/admin/audit',
    icon: <FileCheck className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']
  },
  {
    id: 'backups',
    title: 'גיבויים ושחזור מערכת',
    path: '/admin/backups',
    icon: <HardDrive className="w-5 h-5" />,
    requiredRoles: ['SUPER_ADMIN']
  },
  {
    id: 'settings',
    title: 'הגדרות מערכת / אבטחה',
    path: '/admin/settings',
    icon: <Settings className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN']
  }
];

// TODO: כאשר יהיו roles מדויקים (SUPER_ADMIN, MODERATOR), להשתמש בהם
// כרגע: ADMIN = Admin, ושאר הרשאות עתידיות
function getUserRole(user: any): 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | null {
  if (!user?.isAdmin) return null;
  
  // TODO: כאשר יהיה user.role === 'SUPER_ADMIN' להחזיר SUPER_ADMIN
  // כרגע כל ADMIN נחשב כ-ADMIN רגיל
  return 'ADMIN';
}

function hasAccess(userRole: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | null, requiredRoles: MenuItem['requiredRoles']): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userRole = getUserRole(user);
  const allowedMenuItems = menuItems.filter(item => hasAccess(userRole, item.requiredRoles));

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname === path;
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-[#1F3F3A]">פאנל ניהול</h2>
        <p className="text-sm text-gray-600 mt-1">מערכת ניהול מתקדמת</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4" aria-label="תפריט ניהול">
        <ul className="space-y-1">
          {allowedMenuItems.map((item) => (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive(item.path)
                    ? 'bg-[#1F3F3A] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                <span className={isActive(item.path) ? 'text-white' : 'text-gray-500'}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          תפקיד: {userRole === 'SUPER_ADMIN' ? 'מנהל על' : userRole === 'MODERATOR' ? 'מפקח' : 'מנהל'}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <h1 className="text-lg font-bold text-[#1F3F3A]">פאנל ניהול</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label={isMobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out lg:hidden
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        aria-label="תפריט צד למובייל"
      >
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed right-0 top-0 h-screen w-72 bg-white border-l border-gray-200 shadow-sm z-10">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="lg:mr-72 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
