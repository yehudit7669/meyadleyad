import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEmailPermissions } from '../../hooks/useEmailPermissions';
import {
  LayoutDashboard,
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
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface MenuItem {
  id: string;
  title: string;
  path?: string;
  icon: React.ReactNode;
  requiredRoles: ('ADMIN' | 'SUPER_ADMIN' | 'MODERATOR')[];
  requiredPermission?: string; // Optional: requires email permission
  children?: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  title: string;
  path: string;
  requiredRoles: ('ADMIN' | 'SUPER_ADMIN' | 'MODERATOR')[];
  requiredPermission?: string; // Optional: requires email permission
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
    id: 'ads-management',
    title: 'ניהול מודעות',
    icon: <FileText className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'],
    children: [
      {
        id: 'ads-pending',
        title: 'מודעות ממתינות לאישור',
        path: '/admin/ads/pending',
        requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']
      },
      {
        id: 'ads-manage',
        title: 'ניהול סטטוס מודעות',
        path: '/admin/ads/manage',
        requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']
      }
    ]
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
    requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
    requiredPermission: 'manage_branding' // Allow via email permission
  },
  {
    id: 'imports',
    title: 'ייבוא ונתונים חיצוניים',
    icon: <Download className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
    children: [
      {
        id: 'imports-overview',
        title: 'סקירה כללית',
        path: '/admin/imports',
        requiredRoles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        id: 'import-cities',
        title: 'ייבוא ערים ורחובות',
        path: '/admin/import-cities',
        requiredRoles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        id: 'import-properties',
        title: 'ייבוא נכסים מקובץ',
        path: '/admin/import-properties',
        requiredRoles: ['ADMIN', 'SUPER_ADMIN']
      }
    ]
  },
  {
    id: 'audit',
    title: 'לוג פעולות ניהול',
    path: '/admin/audit',
    icon: <FileCheck className="w-5 h-5" />,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN'] // Moderator אין גישה
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
// כרגע: כל ADMIN נחשב כ-SUPER_ADMIN (עד שיתווסף שדה role)
function getUserRole(user: any): 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | null {
  if (!user) {
    console.log('⚠️ getUserRole: No user');
    return null;
  }
  
  // Check if user has role field (from backend)
  if (user.role) {
    console.log('✅ getUserRole: Using user.role =', user.role);
    if (['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(user.role)) {
      return user.role as 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
    }
  }
  
  // Fallback to isAdmin check
  if (user.isAdmin) {
    console.log('✅ getUserRole: User is admin (fallback)');
    return 'SUPER_ADMIN';
  }
  
  console.log('⚠️ getUserRole: User has no admin access', { user });
  return null;
}

function hasAccess(
  userRole: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | null, 
  requiredRoles: MenuItem['requiredRoles'],
  requiredPermission?: string,
  hasPermission?: (permission: string) => boolean
): boolean {
  // If permission is required, check if user has it
  if (requiredPermission && hasPermission) {
    if (hasPermission(requiredPermission)) {
      return true; // Permission grants access regardless of role
    }
  }
  
  // Otherwise check role
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const { hasPermission } = useEmailPermissions();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['ads-management']); // ניהול מודעות פתוח כברירת מחדל

  const userRole = getUserRole(user);
  const allowedMenuItems = menuItems.filter(item => 
    hasAccess(userRole, item.requiredRoles, item.requiredPermission, hasPermission)
  );

  // Debug logging
  React.useEffect(() => {
    console.log('👤 AdminLayout render:', {
      user: user ? { id: user.id, role: user.role, isAdmin: user.isAdmin } : null,
      userRole,
      allowedMenuItemsCount: allowedMenuItems.length,
      location: location.pathname,
    });
  }, [user, userRole, allowedMenuItems.length, location.pathname]);

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname === path;
  };

  const isChildActive = (children?: SubMenuItem[]) => {
    if (!children) return false;
    return children.some(child => location.pathname === child.path);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-[#1F3F3A]">פאנל ניהול</h2>
        <p className="text-sm text-gray-600 mt-1">מערכת ניהול מתקדמת</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4" aria-label="תפריט ניהול">
        <ul className="space-y-1">
          {allowedMenuItems.map((item) => {
            // Filter children by permissions
            const allowedChildren = item.children?.filter(child => 
              hasAccess(userRole, child.requiredRoles, child.requiredPermission, hasPermission)
            );
            const hasChildren = allowedChildren && allowedChildren.length > 0;
            const isExpanded = expandedCategories.includes(item.id);
            const isItemActive = hasChildren ? isChildActive(allowedChildren) : isActive(item.path);

            return (
              <li key={item.id}>
                {hasChildren ? (
                  <>
                    {/* Category with children */}
                    <button
                      onClick={() => toggleCategory(item.id)}
                      className={`
                        w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors
                        ${isItemActive
                          ? 'bg-[#1F3F3A]/10 text-[#1F3F3A] font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isItemActive ? 'text-[#1F3F3A]' : 'text-gray-500'}>
                          {item.icon}
                        </span>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Sub-menu */}
                    {isExpanded && (
                      <ul className="mt-1 mr-6 space-y-1">
                        {allowedChildren?.map(child => (
                          <li key={child.id}>
                            <Link
                              to={child.path}
                              className={`
                                block px-4 py-2 rounded-lg text-sm transition-colors
                                ${isActive(child.path)
                                  ? 'bg-[#1F3F3A] text-white font-medium'
                                  : 'text-gray-600 hover:bg-gray-100'
                                }
                              `}
                              onClick={() => setIsMobileMenuOpen(false)}
                              aria-current={isActive(child.path) ? 'page' : undefined}
                            >
                              {child.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  /* Regular menu item */
                  <Link
                    to={item.path!}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isItemActive
                        ? 'bg-[#1F3F3A] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={isItemActive ? 'page' : undefined}
                  >
                    <span className={isItemActive ? 'text-white' : 'text-gray-500'}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.title}</span>
                  </Link>
                )}
              </li>
            );
          })}
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
