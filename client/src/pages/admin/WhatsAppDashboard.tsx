import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { whatsappService } from '../../services/api';
import { Link } from 'react-router-dom';

interface DailyReport {
  date: string;
  totalSent: number;
  totalFailed: number;
  groupsUsed: number;
  byCategory: Array<{
    categoryName: string;
    count: number;
  }>;
  byCity: Array<{
    cityName: string;
    count: number;
  }>;
}

export default function WhatsAppDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['whatsapp-dashboard'],
    queryFn: () => whatsappService.getDashboard(),
  });

  const { data: dailyReportData } = useQuery({
    queryKey: ['whatsapp-daily-report', selectedDate],
    queryFn: () => whatsappService.getDailyReport(selectedDate),
  });

  const stats = dashboardData?.stats;
  const groupStats = dashboardData?.groupStats || [];
  const recentActivity = dashboardData?.recentActivity || [];
  const dailyReport: DailyReport | undefined = dailyReportData;

  // Debug log
  if (dailyReport) {
    console.log('📊 Daily Report:', dailyReport);
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      READY: 'bg-green-100 text-green-800',
      SENT: 'bg-blue-100 text-blue-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard - WhatsApp</h1>
          <div className="flex gap-3">
            <Link
              to="/admin/whatsapp/queue"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              📱 תור הפצה
            </Link>
            <Link
              to="/admin/whatsapp/groups"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              👥 קבוצות
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">טוען...</p>
          </div>
        ) : (
          <>
            {/* KPIs ראשיים */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90 mb-1">קבוצות פעילות</div>
                    <div className="text-3xl font-bold">
                      {stats?.activeGroups || 0} / {stats?.totalGroups || 0}
                    </div>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90 mb-1">נשלחו היום</div>
                    <div className="text-3xl font-bold">
                      {stats?.sentToday || 0} / {stats?.totalItemsToday || 0}
                    </div>
                  </div>
                  <div className="text-4xl">✅</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90 mb-1">ממתינים</div>
                    <div className="text-3xl font-bold">{stats?.pendingItems || 0}</div>
                  </div>
                  <div className="text-4xl">⏳</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90 mb-1">כשלונות</div>
                    <div className="text-3xl font-bold">{stats?.failedItems || 0}</div>
                  </div>
                  <div className="text-4xl">❌</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90 mb-1">אחוז הצלחה</div>
                    <div className="text-3xl font-bold">
                      {stats?.totalItemsToday
                        ? Math.round(((stats.sentToday || 0) / stats.totalItemsToday) * 100)
                        : 0}
                      %
                    </div>
                  </div>
                  <div className="text-4xl">📈</div>
                </div>
              </div>
            </div>

            {/* שימוש בקבוצות */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📊 שימוש בקבוצות היום</h2>
                {groupStats.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">אין נתונים</p>
                ) : (
                  <div className="space-y-3">
                    {groupStats.map((group: any) => (
                      <div key={group.groupId} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{group.groupName}</span>
                          <span className="text-sm text-gray-600">
                            {group.sentCount} / {group.dailyQuota}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              group.sentCount >= group.dailyQuota
                                ? 'bg-red-500'
                                : group.sentCount / group.dailyQuota > 0.8
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min((group.sentCount / group.dailyQuota) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* פעילות אחרונה */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🕒 פעילות אחרונה</h2>
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">אין פעילות</p>
                ) : (
                  <div className="space-y-2">
                    {recentActivity.slice(0, 10).map((activity: any) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between border-b border-gray-100 pb-2"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            #{activity.adNumber}
                          </div>
                          <div className="text-xs text-gray-600">{activity.groupName}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(
                              activity.status
                            )}`}
                          >
                            {activity.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.sentAt).toLocaleTimeString('he-IL', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* דוח יומי */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">📅 דוח יומי</h2>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {dailyReport ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* סיכום */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-3">סיכום</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">סה"כ נשלחו:</span>
                        <span className="font-medium text-green-600">{dailyReport.totalSent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">כשלונות:</span>
                        <span className="font-medium text-red-600">{dailyReport.totalFailed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">קבוצות:</span>
                        <span className="font-medium text-blue-600">{dailyReport.groupsUsed}</span>
                      </div>
                    </div>
                  </div>

                  {/* לפי קטגוריה */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-3">לפי קטגוריה</h3>
                    {dailyReport.byCategory?.length ? (
                      <div className="space-y-2 text-sm">
                        {dailyReport.byCategory.map((cat, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2">
                            <span className="text-gray-600 flex-1">{cat.categoryName}</span>
                            <span className="font-bold text-blue-600 text-base">{cat.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">אין נתונים</p>
                    )}
                  </div>

                  {/* לפי עיר */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-3">לפי עיר</h3>
                    {dailyReport.byCity?.length ? (
                      <div className="space-y-2 text-sm">
                        {dailyReport.byCity.map((city, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2">
                            <span className="text-gray-600 flex-1">{city.cityName}</span>
                            <span className="font-bold text-blue-600 text-base">{city.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">אין נתונים</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">אין נתונים לתאריך זה</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
