import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminDashboardService } from '../../services/admin-dashboard.service';
import { useAuth } from '../../hooks/useAuth';
import {
  Users,
  FileText,
  Clock,
  Calendar,
  Image,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Mail,
  HardDrive
} from 'lucide-react';

interface DashboardSummary {
  totalAds: number;
  activeAds: number;
  pendingAds: number;
  draftAds: number;
  expiredAds: number;
  totalUsers: number;
  regularUsers: number;
  brokers: number;
  serviceProviders: number;
  admins: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  approvedAppointments: number;
  pendingAppointments: number;
  canceledAppointments: number;
  recentWatermarks: number;
}

interface ActionItem {
  title: string;
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  link: string;
}

interface UsageItem {
  page: string;
  views: number;
  avgTime: string;
}

interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // Live Stats - refetch כל 30 שניות
  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ['admin-dashboard-summary'],
    queryFn: adminDashboardService.getSummary,
    refetchInterval: 30000,
    staleTime: 20000
  });

  // Action Center
  const { data: actions, isLoading: actionsLoading } = useQuery<ActionItem[]>({
    queryKey: ['admin-dashboard-actions'],
    queryFn: adminDashboardService.getActions,
    refetchInterval: 60000,
    staleTime: 40000
  });

  // Usage Analytics
  const { data: usage, isLoading: usageLoading } = useQuery<UsageItem[]>({
    queryKey: ['admin-dashboard-usage'],
    queryFn: adminDashboardService.getUsage,
    staleTime: 300000 // 5 דקות
  });

  // Recent Activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery<ActivityItem[]>({
    queryKey: ['admin-dashboard-activity'],
    queryFn: adminDashboardService.getRecentActivity,
    refetchInterval: 45000,
    staleTime: 30000
  });

  const isAdmin = user?.isAdmin;
  const canExport = isAdmin; // TODO: בעתיד לבדוק role מדויק

  const handleExportUsage = async () => {
    try {
      await adminDashboardService.exportUsage();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F3F3A] mx-auto mb-4"></div>
          <p className="text-black">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  const urgencyColors = {
    LOW: 'bg-blue-100 text-blue-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">דשבורד מנהל</h1>
          <p className="text-black mt-1">מרכז שליטה ראשי</p>
        </div>
        <div className="text-sm text-black">
          עדכון אחרון: {new Date().toLocaleTimeString('he-IL')}
        </div>
      </div>

      {/* 1. Live Stats Widgets */}
      <section aria-label="סטטיסטיקות חיות">
        <h2 className="text-xl font-bold text-black mb-4">סטטיסטיקות מערכת</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* כרטיס מודעות */}
          <Link
            to="/admin/ads"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-black text-sm">סה״כ מודעות באתר</p>
                <p className="text-3xl font-bold text-black mt-1">{summary?.totalAds || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-black">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>פעילות: {summary?.activeAds || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-600" />
                <span>ממתינות: {summary?.pendingAds || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-gray-600" />
                <span>טיוטות: {summary?.draftAds || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-600" />
                <span>פגות: {summary?.expiredAds || 0}</span>
              </div>
            </div>
          </Link>

          {/* כרטיס ממתינות לאישור */}
          <Link
            to="/admin/pending"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-black text-sm">ממתינות לאישור</p>
                <p className="text-3xl font-bold text-black mt-1">{summary?.pendingAds || 0}</p>
              </div>
              <div className={`p-3 rounded-lg ${(summary?.pendingAds || 0) > 5 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                <Clock className={`w-6 h-6 ${(summary?.pendingAds || 0) > 5 ? 'text-red-600' : 'text-yellow-600'}`} />
              </div>
            </div>
            <p className="text-xs text-black">
              {(summary?.pendingAds || 0) > 5 ? '⚠️ עומס גבוה - נדרשת תשומת לב' : '✅ רמת עומס תקינה'}
            </p>
          </Link>

          {/* כרטיס משתמשים */}
          <Link
            to="/admin/users"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-black text-sm">סה״כ משתמשים</p>
                <p className="text-3xl font-bold text-black mt-1">{summary?.totalUsers || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-black">
              <div>פרטיים: {summary?.regularUsers || 0}</div>
              <div>מתווכים: {summary?.brokers || 0}</div>
              <div>נותני שירות: {summary?.serviceProviders || 0}</div>
              <div>מנהלים: {summary?.admins || 0}</div>
            </div>
          </Link>

          {/* כרטיס תיאומי פגישות */}
          <Link
            to="/admin/appointments"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-black text-sm">תיאומי פגישות</p>
                <p className="text-3xl font-bold text-black mt-1">{summary?.appointmentsThisMonth || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-black">
              <div>השבוע: {summary?.appointmentsThisWeek || 0}</div>
              <div>מאושרות: {summary?.approvedAppointments || 0}</div>
              <div>ממתינות: {summary?.pendingAppointments || 0}</div>
              <div>בוטלו: {summary?.canceledAppointments || 0}</div>
            </div>
          </Link>

          {/* כרטיס Watermark */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-black text-sm">Watermark לאחרונה</p>
                <p className="text-3xl font-bold text-black mt-1">{summary?.recentWatermarks || 0}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Image className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-black">ב-24 השעות האחרונות</p>
          </div>
        </div>
      </section>

      {/* 2. Action Center */}
      <section aria-label="מרכז פעולות">
        <h2 className="text-xl font-bold text-black mb-4">נקודות פעולה דחופות</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          {actionsLoading ? (
            <div className="text-center py-8 text-black">טוען...</div>
          ) : !actions || actions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-black">אין פעולות דחופות כרגע</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actions.map((action, idx: number) => (
                <Link
                  key={idx}
                  to={action.link}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`w-5 h-5 ${
                      action.urgency === 'HIGH' ? 'text-red-600' :
                      action.urgency === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <div>
                      <p className="font-medium text-black">{action.title}</p>
                      <p className="text-sm text-black">{action.description}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${urgencyColors[action.urgency as keyof typeof urgencyColors]}`}>
                    {action.urgency === 'HIGH' ? 'דחוף' : action.urgency === 'MEDIUM' ? 'בינוני' : 'נמוך'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 3. Usage Analytics */}
        <section aria-label="ניתוח שימוש במערכת">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">צפיות ושימוש במערכת</h2>
            {canExport && (
              <button
                onClick={handleExportUsage}
                className="flex items-center gap-2 px-4 py-2 bg-[#1F3F3A] text-white rounded-lg hover:bg-[#2d5a52] transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                ייצוא CSV
              </button>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            {usageLoading ? (
              <div className="text-center py-8 text-black">טוען...</div>
            ) : !usage || usage.length === 0 ? (
              <div className="text-center py-8 text-black">אין נתונים זמינים</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-black">
                  <thead className="border-b">
                    <tr>
                      <th className="text-right py-2">עמוד</th>
                      <th className="text-center py-2">צפיות</th>
                      <th className="text-center py-2">זמן ממוצע</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.map((item, idx: number) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-3">{item.page}</td>
                        <td className="text-center">{item.views}</td>
                        <td className="text-center">{item.avgTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* 4. Recent Activity */}
        <section aria-label="פעילות אחרונה">
          <h2 className="text-xl font-bold text-black mb-4">פעילות אחרונה</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            {activityLoading ? (
              <div className="text-center py-8 text-black">טוען...</div>
            ) : !recentActivity || recentActivity.length === 0 ? (
              <div className="text-center py-8 text-black">אין פעילות אחרונה</div>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 10).map((activity, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 border-b last:border-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'APPROVED' ? 'bg-green-500' :
                      activity.type === 'REJECTED' ? 'bg-red-500' :
                      activity.type === 'BLOCKED' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">{activity.description}</p>
                      <p className="text-xs text-black mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 5. Quick Actions */}
      <section aria-label="פעולות מהירות">
        <h2 className="text-xl font-bold text-black mb-4">פעולות מהירות</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link
            to="/admin/content"
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
          >
            <Mail className="w-8 h-8 text-[#1F3F3A] mx-auto mb-2" />
            <p className="text-sm font-medium text-black">הוסף תוכן להפצה</p>
          </Link>

          <Link
            to="/admin/pending"
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
          >
            <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-black">מודעות ממתינות</p>
          </Link>

          <Link
            to="/admin/users"
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
          >
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-black">ניהול משתמשים</p>
          </Link>

          {canExport && (
            <button
              onClick={handleExportUsage}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
            >
              <Download className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-black">ייצוא נתונים</p>
            </button>
          )}

          {/* TODO: להציג רק ל-Super Admin בעתיד */}
          {isAdmin && (
            <Link
              to="/admin/backups"
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
            >
              <HardDrive className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-black">גיבויים</p>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
