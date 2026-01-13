import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { brokerService } from '../../services/api';

const AuditLogTab: React.FC = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['broker-audit-log'],
    queryFn: () => brokerService.getAuditLog(100),
  });

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      UPDATE_PROFILE: 'עדכון פרטים אישיים',
      UPDATE_PREFS: 'עדכון העדפות תקשורת',
      UPDATE_SETTINGS: 'עדכון הגדרות',
      DELETE_AD: 'מחיקת מודעה',
      CREATE_AD: 'יצירת מודעה / בקשת הבלטה',
      UPDATE_AD: 'עדכון מודעה',
      ADD_TEAM_MEMBER: 'הוספת איש צוות',
      UPDATE_TEAM_MEMBER: 'עדכון פרטי איש צוות',
      REMOVE_TEAM_MEMBER: 'הסרת איש צוות',
      UPDATE_OFFICE: 'עדכון פרטי משרד',
      UPDATE_BRANDING: 'עדכון לוגו',
      DELETE_REQ: 'בקשת מחיקת חשבון',
      SCHEDULE_APPOINTMENT: 'אישור פגישה',
      CANCEL_APPOINTMENT: 'דחיית פגישה',
    };
    return labels[action] || action;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">לוג מערכת (Audit)</h2>
        <p className="text-gray-600">
          כל הפעולות שביצעת במערכת מתועדות כאן לצרכי אבטחה ותמיכה.
        </p>
      </div>

      {!logs || logs.length === 0 ? (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-700">אין פעולות מתועדות עדיין</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    תאריך ושעה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פרטים נוספים
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.meta && typeof log.meta === 'object' && Object.keys(log.meta).length > 0 ? (
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-700">הצג פרטים</summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-md">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 רשומות אלו נשמרות למטרות אבטחה ותמיכה טכנית בלבד. הן אינן נמחקות והן נשמרות בהתאם למדיניות הפרטיות של המערכת.
        </p>
      </div>
    </div>
  );
};

export default AuditLogTab;
