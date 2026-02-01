import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Shield, 
  Lock, 
  FileText, 
  Mail, 
  Eye, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';

type TabType = 'rbac' | 'permissions' | 'exports' | 'email-permissions' | 'gdpr' | 'backups';

interface EmailPermission {
  id: string;
  email: string;
  permissionType: string;
  scope: 'one-time' | 'permanent';
  expiry?: string;
  adminNote: string;
  createdAt: string;
  createdBy: string;
}

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('rbac');
  const [emailPermissions, setEmailPermissions] = useState<EmailPermission[]>([]);
  const [isAddingPermission, setIsAddingPermission] = useState(false);
  const [editingPermissionId, setEditingPermissionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPermission, setNewPermission] = useState({
    email: '',
    permissionType: '',
    scope: 'one-time' as 'one-time' | 'permanent',
    expiry: '',
    adminNote: ''
  });

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Load permissions from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('emailPermissions');
      if (saved) {
        setEmailPermissions(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading permissions from localStorage:', error);
    }
  }, []);

  const handleAddPermission = useCallback(async () => {
    if (!newPermission.email || !newPermission.permissionType || !newPermission.adminNote) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create permission data object
      const permissionData = {
        email: newPermission.email,
        permissionType: newPermission.permissionType,
        scope: newPermission.scope,
        expiry: newPermission.expiry || undefined,
        adminNote: newPermission.adminNote
      };

      const token = localStorage.getItem('accessToken');
      
      // Determine if we're editing or creating
      const isEditing = editingPermissionId !== null;
      const url = isEditing 
        ? `${import.meta.env.VITE_API_URL}/admin/email-permissions/${editingPermissionId}`
        : `${import.meta.env.VITE_API_URL}/admin/email-permissions`;
      const method = isEditing ? 'PUT' : 'POST';

      // Send to backend
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify(permissionData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        
        if (response.status === 401) {
          throw new Error('אינך מחובר למערכת. אנא התחבר מחדש.');
        }
        
        if (response.status === 403) {
          throw new Error('אין לך הרשאה לבצע פעולה זו. נדרשת הרשאת Super Admin.');
        }
        
        throw new Error(errorData?.error || errorData?.message || 'שגיאה בשמירת ההרשאה');
      }

      // Success - add/update the permission returned from server
      const savedPermission = await response.json();
      
      if (isEditing) {
        // Update existing permission
        const updatedPermissions = emailPermissions.map(p => 
          p.id === editingPermissionId ? savedPermission : p
        );
        setEmailPermissions(updatedPermissions);
        localStorage.setItem('emailPermissions', JSON.stringify(updatedPermissions));
      } else {
        // Add new permission
        const updatedPermissions = [...emailPermissions, savedPermission];
        setEmailPermissions(updatedPermissions);
        localStorage.setItem('emailPermissions', JSON.stringify(updatedPermissions));
      }
      
      // Reset form
      setIsAddingPermission(false);
      setEditingPermissionId(null);
      setNewPermission({
        email: '',
        permissionType: '',
        scope: 'one-time',
        expiry: '',
        adminNote: ''
      });
    } catch (err) {
      console.error('Error adding permission:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בשמירת ההרשאה');
    } finally {
      setIsLoading(false);
    }
  }, [newPermission, emailPermissions]);

  const handleDeletePermission = useCallback(async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הרשאה זו?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/email-permissions/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('שגיאה במחיקת ההרשאה');
      }

      // Remove from state
      setEmailPermissions(prev => prev.filter(p => p.id !== id));
      
      // Update localStorage
      const updated = emailPermissions.filter(p => p.id !== id);
      localStorage.setItem('emailPermissions', JSON.stringify(updated));
    } catch (err) {
      console.error('Error deleting permission:', err);
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת ההרשאה');
    } finally {
      setIsLoading(false);
    }
  }, [emailPermissions]);

  const handleEditPermission = useCallback((permission: EmailPermission) => {
    // Fill the form with existing permission data
    setNewPermission({
      email: permission.email,
      permissionType: permission.permissionType,
      scope: permission.scope,
      expiry: permission.expiry || '',
      adminNote: permission.adminNote
    });
    setEditingPermissionId(permission.id);
    setIsAddingPermission(true);
  }, []);

  const tabs = [
    { id: 'rbac' as TabType, label: 'RBAC ותפקידי מערכת', icon: Shield },
    { id: 'permissions' as TabType, label: 'טבלת הרשאות', icon: Lock },
    { id: 'exports' as TabType, label: 'ייצוא והורדות', icon: FileText },
    { id: 'email-permissions' as TabType, label: 'הרשאות חריגות לפי אימייל', icon: Mail },
    { id: 'gdpr' as TabType, label: 'GDPR ופרטיות', icon: Eye },
    { id: 'backups' as TabType, label: 'גיבויים ושחזור', icon: Database }
  ];

  // Tab 1: RBAC and System Roles
  const RBACTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">מערכת הרשאות RBAC</h3>
        </div>
        <p className="text-gray-700">
          המערכת משתמשת ב-Role-Based Access Control (RBAC) לניהול הרשאות משתמשים.
          כל משתמש מוקצה לתפקיד אחד, והתפקיד קובע את ההרשאות שלו במערכת.
        </p>
      </div>

      {/* Super Admin Card */}
      <div className="bg-white border-2 border-red-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">Super Admin</h4>
              <p className="text-sm text-gray-600">מנהל על - הרשאות מלאות</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            הרשאות קריטיות
          </span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>גישה מלאה:</strong> כל הפעולות במערכת ללא הגבלה</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>ניהול משתמשים:</strong> יצירה, עריכה ומחיקת משתמשים</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>ניהול הרשאות:</strong> שינוי תפקידים והרשאות</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>גישה לנתונים רגישים:</strong> מידע אישי מלא, תשלומים, סטטיסטיקות</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>ייצוא מלא:</strong> כולל שדות רגישים (מייל, טלפון, IP)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>גיבויים ושחזור:</strong> ניהול גיבויי מערכת</span>
          </div>
        </div>
      </div>

      {/* Admin Card */}
      <div className="bg-white border-2 border-blue-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">Admin</h4>
              <p className="text-sm text-gray-600">מנהל - ניהול שוטף</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            ניהול מלא
          </span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>ניהול תוכן:</strong> אישור, עריכה ומחיקת מודעות</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>ניהול משתמשים:</strong> צפייה ועריכה (ללא שינוי הרשאות)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>תפוצה:</strong> יצירת ושליחת תפוצות</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>ייצוא מוגבל:</strong> ללא שדות רגישים</span>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <span><strong>אין גישה:</strong> שינוי הרשאות, גיבויים, Audit Log מלא</span>
          </div>
        </div>
      </div>

      {/* Moderator Card */}
      <div className="bg-white border-2 border-green-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">Moderator</h4>
              <p className="text-sm text-gray-600">מפקח - קריאה ואישור בלבד</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            גישה מוגבלת
          </span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>צפייה:</strong> כל התוכן והמשתמשים (קריאה בלבד)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>אישור מודעות:</strong> אישור או דחייה בלבד</span>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <span><strong>אין הרשאה:</strong> עריכה, מחיקה, ייצוא נתונים</span>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <span><strong>אין גישה:</strong> הגדרות מערכת, גיבויים, Audit Log</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <strong>הערה חשובה:</strong> שינוי תפקיד משתמש דורש הרשאות Super Admin ומתועד ב-Audit Log.
            כל פעולה קריטית נרשמת ונשמרת למעקב ובקרה.
          </div>
        </div>
      </div>
    </div>
  );

  // Tab 2: Permissions Table
  const PermissionsTableTab = () => {
    const permissions = [
      { action: 'צפייה במודעות', superAdmin: 'full', admin: 'full', moderator: 'full' },
      { action: 'אישור מודעות', superAdmin: 'full', admin: 'full', moderator: 'approve-only' },
      { action: 'עריכת מודעות', superAdmin: 'full', admin: 'full', moderator: 'no' },
      { action: 'מחיקת מודעות', superAdmin: 'full', admin: 'full', moderator: 'no' },
      { action: 'צפייה במשתמשים', superAdmin: 'full', admin: 'full', moderator: 'limited' },
      { action: 'עריכת משתמשים', superAdmin: 'full', admin: 'basic', moderator: 'no' },
      { action: 'שינוי הרשאות משתמשים', superAdmin: 'full', admin: 'no', moderator: 'no' },
      { action: 'מחיקת משתמשים', superAdmin: 'full', admin: 'no', moderator: 'no' },
      { action: 'יצירת תפוצות', superAdmin: 'full', admin: 'full', moderator: 'no' },
      { action: 'שליחת תפוצות', superAdmin: 'full', admin: 'full', moderator: 'no' },
      { action: 'ייצוא משתמשים', superAdmin: 'full-sensitive', admin: 'limited', moderator: 'no' },
      { action: 'ייצוא מודעות', superAdmin: 'full-sensitive', admin: 'limited', moderator: 'no' },
      { action: 'ייצוא סטטיסטיקות', superAdmin: 'full', admin: 'limited', moderator: 'no' },
      { action: 'צפייה ב-Audit Log', superAdmin: 'full', admin: 'own-actions', moderator: 'no' },
      { action: 'ניהול גיבויים', superAdmin: 'full', admin: 'no', moderator: 'no' },
      { action: 'שחזור מערכת', superAdmin: 'full', admin: 'no', moderator: 'no' },
      { action: 'הגדרות מערכת', superAdmin: 'full', admin: 'view-only', moderator: 'no' },
    ];

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'full':
        case 'full-sensitive':
          return <CheckCircle className="w-5 h-5 text-green-600" />;
        case 'limited':
        case 'basic':
        case 'approve-only':
        case 'view-only':
        case 'own-actions':
          return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
        case 'no':
          return <XCircle className="w-5 h-5 text-red-600" />;
        default:
          return null;
      }
    };

    const getStatusText = (status: string) => {
      const statusMap: Record<string, string> = {
        'full': 'מלא',
        'full-sensitive': 'מלא + רגיש',
        'limited': 'מוגבל',
        'basic': 'בסיסי',
        'approve-only': 'אישור בלבד',
        'view-only': 'צפייה בלבד',
        'own-actions': 'פעולות עצמיות',
        'no': 'אסור'
      };
      return statusMap[status] || status;
    };

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-800">טבלת הרשאות מפורטת</h3>
          </div>
          <p className="text-gray-700">
            טבלה זו מציגה את כל ההרשאות במערכת לפי תפקיד. ההרשאות נאכפות ברמת השרת ולא ניתן לשנותן דרך ה-UI.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">פעולה</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-red-700">Super Admin</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-700">Admin</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-green-700">Moderator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {permissions.map((perm, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{perm.action}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(perm.superAdmin)}
                        <span className="text-sm text-gray-700">{getStatusText(perm.superAdmin)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(perm.admin)}
                        <span className="text-sm text-gray-700">{getStatusText(perm.admin)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(perm.moderator)}
                        <span className="text-sm text-gray-700">{getStatusText(perm.moderator)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>הערות חשובות:</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li><strong>ייצוא מוגבל:</strong> ללא שדות רגישים כמו אימייל, טלפון, IP, סיסמאות</li>
              <li><strong>ייצוא מלא + רגיש:</strong> כולל את כל השדות (רק Super Admin)</li>
              <li><strong>פעולות עצמיות:</strong> Admin יכול לראות רק פעולות שהוא ביצע ב-Audit Log</li>
              <li><strong>אישור בלבד:</strong> Moderator יכול לאשר/לדחות מודעות אבל לא לערוך או למחוק</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Tab 3: Exports and Downloads
  const ExportsTab = () => {
    const currentUserRole = user?.role || 'ADMIN';
    
    const exportItems = [
      {
        name: 'ייצוא משתמשים',
        superAdmin: 'מותר (כולל שדות רגישים)',
        admin: 'מותר (ללא אימייל/טלפון)',
        moderator: 'לא מורשה'
      },
      {
        name: 'ייצוא מודעות',
        superAdmin: 'מותר (כולל IP ומידע רגיש)',
        admin: 'מותר (מידע בסיסי בלבד)',
        moderator: 'לא מורשה'
      },
      {
        name: 'ייצוא רשימת תפוצה',
        superAdmin: 'מותר',
        admin: 'מותר',
        moderator: 'לא מורשה'
      },
      {
        name: 'ייצוא סטטיסטיקות',
        superAdmin: 'מותר (מלא)',
        admin: 'מותר (מוגבל)',
        moderator: 'לא מורשה'
      },
      {
        name: 'הורדת Audit Log',
        superAdmin: 'מותר (כל הפעולות)',
        admin: 'מותר (פעולות עצמיות בלבד)',
        moderator: 'לא מורשה'
      },
      {
        name: 'הורדת גיבויים',
        superAdmin: 'מותר',
        admin: 'לא מורשה',
        moderator: 'לא מורשה'
      }
    ];

    const getUserPermission = (item: typeof exportItems[0]) => {
      if (currentUserRole === 'SUPER_ADMIN') return item.superAdmin;
      if (currentUserRole === 'ADMIN') return item.admin;
      return item.moderator;
    };

    const isAllowed = (permission: string) => !permission.includes('לא מורשה');

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-800">מדיניות ייצוא והורדות</h3>
          </div>
          <p className="text-gray-700">
            טאב זה מציג את מדיניות הייצוא והורדות במערכת. כל ייצוא מוגבל בהתאם לתפקיד ומתועד ב-Audit Log.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-bold text-gray-800 mb-4">הרשאות הייצוא שלך</h4>
          <div className="space-y-3">
            {exportItems.map((item, idx) => {
              const permission = getUserPermission(item);
              const allowed = isAllowed(permission);
              
              return (
                <div 
                  key={idx} 
                  className={`flex items-start justify-between p-4 rounded-lg border-2 ${
                    allowed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {allowed ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <h5 className="font-semibold text-gray-800">{item.name}</h5>
                      <p className={`text-sm ${allowed ? 'text-green-700' : 'text-gray-600'}`}>
                        {permission}
                      </p>
                    </div>
                  </div>
                  {allowed && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      מורשה
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-bold text-gray-800 mb-4">אבטחת ייצוא</h4>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-gray-800 mb-1">Token חד-פעמי</h5>
                <p className="text-sm text-gray-600">
                  כל ייצוא מקבל Token ייחודי עם תוקף זמן מוגבל (TTL). לאחר השימוש או פקיעת התוקף, ה-Token נמחק.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-gray-800 mb-1">הצפנה ואבטחה</h5>
                <p className="text-sm text-gray-600">
                  כל הקבצים המיוצאים מוגנים בהצפנה. ייצוא של שדות רגישים זמין רק ל-Super Admin.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-gray-800 mb-1">תיעוד מלא</h5>
                <p className="text-sm text-gray-600">
                  כל פעולת ייצוא מתועדת ב-Audit Log כולל: מי ביצע, מתי, איזה נתונים, וכתובת IP.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>שימו לב:</strong> ייצוא נתונים רגישים דורש אישור נוסף ומתועד במיוחד. 
              השימוש ב-Token חד-פעמי מונע שימוש חוזר בקישורי הורדה.
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tab 4: Email-based Permissions
  const EmailPermissionsTab = useMemo(() => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-bold text-gray-800">הרשאות חריגות לפי אימייל</h3>
          </div>
          <p className="text-gray-700">
            מאפשר מתן הרשאות ייצוא ספציפיות למשתמשים על בסיס כתובת אימייל, למקרים חריגים בלבד.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800">ניהול הרשאות חריגות</h4>
              {!isAddingPermission && (
                <button
                  onClick={() => setIsAddingPermission(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  הוסף הרשאה חריגה
                </button>
              )}
            </div>

            {isAddingPermission && (
              <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-4">הרשאה חריגה חדשה</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      אימייל משתמש *
                    </label>
                    <input
                      type="email"
                      value={newPermission.email}
                      onChange={(e) => setNewPermission(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="user@example.com"
                      autoComplete="off"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      סוג הרשאה *
                    </label>
                    <select
                      value={newPermission.permissionType}
                      onChange={(e) => setNewPermission(prev => ({ ...prev, permissionType: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">בחר סוג הרשאה</option>
                      <option value="publish_without_approval">פרסום מודעות ללא אישור</option>
                      <option value="export_users">ייצוא משתמשים</option>
                      <option value="export_ads">ייצוא מודעות</option>
                      <option value="export_stats">ייצוא סטטיסטיקות</option>
                      <option value="export_mailing_list">ייצוא רשימת תפוצה</option>
                      <option value="download_audit_log">הורדת Audit Log</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      תוקף *
                    </label>
                    <select
                      value={newPermission.scope}
                      onChange={(e) => setNewPermission(prev => ({ ...prev, scope: e.target.value as 'one-time' | 'permanent' }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="one-time">חד-פעמי</option>
                      <option value="permanent">קבוע</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      תאריך תפוגה (אופציונלי)
                    </label>
                    <input
                      type="date"
                      value={newPermission.expiry}
                      onChange={(e) => setNewPermission(prev => ({ ...prev, expiry: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      הערת מנהל (נדרשת) *
                    </label>
                    <textarea
                      value={newPermission.adminNote}
                      onChange={(e) => setNewPermission(prev => ({ ...prev, adminNote: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="סיבה למתן ההרשאה החריגה..."
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">{error}</p>
                  </div>
                )}

                {(!newPermission.email || !newPermission.permissionType || !newPermission.adminNote) && !isLoading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium mb-1">יש למלא את כל השדות הבאים:</p>
                    <ul className="text-sm text-blue-700 list-disc list-inside space-y-0.5">
                      {!newPermission.email && <li>אימייל משתמש</li>}
                      {!newPermission.permissionType && <li>סוג הרשאה</li>}
                      {!newPermission.adminNote && <li>הערת מנהל (נדרשת)</li>}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddPermission}
                    disabled={!newPermission.email || !newPermission.permissionType || !newPermission.adminNote || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>שומר...</span>
                      </>
                    ) : (
                      'שמור הרשאה'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingPermission(false);
                      setError(null);
                      setNewPermission({
                        email: '',
                        permissionType: '',
                        scope: 'one-time',
                        expiry: '',
                        adminNote: ''
                      });
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}

            {emailPermissions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>אין הרשאות חריגות פעילות כרגע</p>
                <p className="text-sm mt-1">לחץ על "הוסף הרשאה חריגה" כדי להתחיל</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emailPermissions.map((perm) => (
                  <div key={perm.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">{perm.email}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          perm.scope === 'permanent' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {perm.scope === 'permanent' ? 'קבוע' : 'חד-פעמי'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{perm.permissionType}</p>
                      <p className="text-xs text-gray-500 mt-1">הערה: {perm.adminNote}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditPermission(perm)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="ערוך הרשאה"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePermission(perm.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="מחק הרשאה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isSuperAdmin && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-semibold text-gray-700 mb-2">גישה מוגבלת</h4>
            <p className="text-gray-600">
              ניהול הרשאות חריגות זמין רק למנהלי על (Super Admin)
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>חשוב לדעת:</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>כל הרשאה חריגה נרשמת אוטומטית ב-Audit Log</li>
              <li>הרשאות חד-פעמיות נמחקות אוטומטית לאחר השימוש</li>
              <li>רק Super Admin יכול ליצור, לערוך או למחוק הרשאות חריגות</li>
              <li>הערת המנהל היא שדה חובה לתיעוד ומעקב</li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>הערה:</strong> תכונה זו נמצאת בפיתוח. ה-UI מוכן אך טרם מחובר ל-Backend.
              כאשר ה-Backend יהיה זמין, התכונה תפעל באופן אוטומטי.
            </div>
          </div>
        </div>
      </div>
    );
  }, [isSuperAdmin, isAddingPermission, newPermission, emailPermissions, handleAddPermission, isLoading, error]);

  // Tab 5: GDPR and Privacy
  const GDPRTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Eye className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-bold text-gray-800">GDPR ופרטיות משתמשים</h3>
        </div>
        <p className="text-gray-700">
          המערכת מכבדת את זכויות המשתמשים לפרטיות ומאפשרת ניהול נתונים אישיים בהתאם ל-GDPR.
        </p>
      </div>

      {/* Account Deletion Request */}
      <div className="bg-white border-2 border-red-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <h4 className="text-lg font-bold text-gray-800">בקשות מחיקת חשבון</h4>
        </div>
        
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p>משתמש יכול לבקש מחיקת חשבונו דרך דף הפרופיל האישי</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p><strong>דורש אישור Admin/Super Admin</strong> - מחיקות לא מתבצעות אוטומטית</p>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p>כל בקשת מחיקה מתועדת ב-Audit Log כולל סיבת המחיקה</p>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <p>לאחר מחיקה, הנתונים האישיים מוסרים לצמיתות (אין אפשרות שחזור)</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">
            <strong>חשוב:</strong> מחיקת משתמש היא פעולה בלתי הפיכה. יש לוודא את הסיבה והצורך לפני אישור.
          </p>
        </div>
      </div>

      {/* Data Export Request */}
      <div className="bg-white border-2 border-blue-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="text-lg font-bold text-gray-800">בקשות ייצוא נתונים אישיים</h4>
        </div>
        
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p>משתמש זכאי לקבל עותק של כל הנתונים האישיים שלו</p>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p>הנתונים מיוצאים בפורמט JSON/CSV הכולל: פרופיל, מודעות, פעילות</p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <p>קישור ההורדה מאובטח ב-Token חד-פעמי עם תוקף זמן מוגבל</p>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <p>כל בקשה מתועדת ב-Audit Log למעקב ובקרה</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>שימו לב:</strong> ייצוא נתונים אישיים זמין למשתמש עצמו דרך דף הפרופיל, או ע"י מנהל לפי בקשה.
          </p>
        </div>
      </div>

      {/* Mailing List Removal */}
      <div className="bg-white border-2 border-green-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="w-5 h-5 text-green-600" />
          </div>
          <h4 className="text-lg font-bold text-gray-800">הסרה מרשימות תפוצה</h4>
        </div>
        
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p>משתמש יכול לבטל מנוי מרשימות תפוצה בכל עת</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p>הסרה מתבצעת באופן מיידי וללא אפשרות לשלוח מיילים שיווקיים</p>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p>כל פעולת הסרה מתועדת ב-Audit Log</p>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p><strong>אין מחיקות שקטות</strong> - כל שינוי נרשם ומתועד</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800">
            <strong>חשוב:</strong> המערכת שומרת על רשימת "לא לשלוח" גם אם המשתמש ימחק את חשבונו.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-800 mb-2">עקרונות GDPR במערכת</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>✅ שקיפות מלאה - משתמשים יודעים אילו נתונים נאספים</li>
              <li>✅ זכות גישה - כל משתמש יכול לראות את הנתונים שלו</li>
              <li>✅ זכות למחיקה - "הזכות להישכח"</li>
              <li>✅ זכות לניידות - ייצוא נתונים בפורמט נגיש</li>
              <li>✅ תיעוד מלא - כל פעולה מתועדת</li>
              <li>✅ אבטחה - הצפנה והגנה על נתונים רגישים</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Tab 6: Backups and Restore
  const BackupsTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-100 to-slate-200 border border-gray-300 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-6 h-6 text-gray-700" />
          <h3 className="text-xl font-bold text-gray-800">גיבויים ושחזור מערכת</h3>
        </div>
        <p className="text-gray-700">
          מערכת הגיבויים מאפשרת יצירת גיבויים אוטומטיים וידניים של כל נתוני המערכת, כולל מסד הנתונים והקבצים.
        </p>
      </div>

      <div className="bg-white border-2 border-blue-300 rounded-lg p-8 text-center shadow-sm">
        <Database className="w-16 h-16 mx-auto mb-4 text-blue-600" />
        <h4 className="text-xl font-bold text-gray-800 mb-3">מסך גיבויים ושחזור</h4>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          המערכת כוללת מסך ייעודי לניהול גיבויים ושחזור. 
          במסך זה ניתן ליצור גיבויים ידניים, לצפות בהיסטוריית גיבויים, ולשחזר את המערכת לנקודת זמן קודמת.
        </p>
        
        <Link
          to="/admin/backups"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
        >
          <ExternalLink className="w-5 h-5" />
          מעבר למסך גיבויים ושחזור
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h5 className="font-bold text-gray-800">גיבויים אוטומטיים</h5>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              <span>גיבוי יומי אוטומטי בשעות הלילה</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              <span>שמירת 30 גיבויים אחרונים</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              <span>גיבוי לפני עדכונים קריטיים</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h5 className="font-bold text-gray-800">אבטחת גיבויים</h5>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>הצפנה מלאה של קבצי הגיבוי</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>אחסון מאובטח ומבודד</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>גישה רק ל-Super Admin</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-red-800 mb-2">אזהרת אבטחה</h5>
            <p className="text-sm text-red-700">
              <strong>שחזור מערכת הוא פעולה קריטית!</strong> פעולה זו תחזיר את כל המערכת לנקודת זמן קודמת.
              כל השינויים שנעשו מאז הגיבוי יאבדו. יש לבצע רק לאחר תיאום ואישור.
              כל פעולת שחזור מתועדת ב-Audit Log ודורשת אימות נוסף.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>תכולת הגיבוי:</strong></p>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>מסד נתונים מלא (משתמשים, מודעות, קטגוריות, וכו')</li>
            <li>קבצי מדיה (תמונות, PDF, קבצים מועלים)</li>
            <li>הגדרות מערכת וקונפיגורציות</li>
            <li>Audit Log (היסטוריית פעולות)</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'rbac':
        return <RBACTab />;
      case 'permissions':
        return <PermissionsTableTab />;
      case 'exports':
        return <ExportsTab />;
      case 'email-permissions':
        return EmailPermissionsTab;
      case 'gdpr':
        return <GDPRTab />;
      case 'backups':
        return <BackupsTab />;
      default:
        return <RBACTab />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          הגדרות מערכת - אבטחה והרשאות
        </h1>
        <p className="text-gray-600">
          ניהול הרשאות, אבטחה, פרטיות וציות במערכת
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors
                  ${isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
