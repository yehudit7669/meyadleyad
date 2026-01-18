import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileSpreadsheet, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../services/api';

interface ImportLog {
  id: string;
  importType: string;
  fileName: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  createdAt: string;
}

export default function ImportsPage() {
  const [history, setHistory] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/admin/import/history?limit=20');
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching import history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImportTypeLabel = (type: string) => {
    switch (type) {
      case 'CITIES_STREETS':
        return 'ערים ורחובות';
      case 'PROPERTIES':
        return 'נכסים/מודעות';
      default:
        return type;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">ייבוא ונתונים חיצוניים</h1>
        <p className="text-black mt-2">
          ניהול ייבוא נתונים ממקורות חיצוניים למערכת
        </p>
      </div>

      {/* Import Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Cities & Streets Import */}
        <Link
          to="/admin/import-cities"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[#1F3F3A]"
        >
          <div className="flex items-start gap-4">
            <div className="bg-[#1F3F3A]/10 p-3 rounded-lg">
              <MapPin className="w-8 h-8 text-[#1F3F3A]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-black mb-2">ייבוא ערים ורחובות</h2>
              <p className="text-black text-sm mb-3">
                ייבוא ערים, רחובות ושכונות מקובץ XLSX או CSV
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• תמיכה ב-XLSX ו-CSV</li>
                <li>• בדיקות תקינות מקדימות</li>
                <li>• אפשרויות מיזוג או החלפה</li>
              </ul>
            </div>
          </div>
        </Link>

        {/* Properties Import */}
        <Link
          to="/admin/import-ads"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[#1F3F3A]"
        >
          <div className="flex items-start gap-4">
            <div className="bg-[#1F3F3A]/10 p-3 rounded-lg">
              <FileSpreadsheet className="w-8 h-8 text-[#1F3F3A]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-black mb-2">ייבוא נכסים מקובץ</h2>
              <p className="text-black text-sm mb-3">
                ייבוא מודעות נכסים מקובץ XLSX
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• תמיכה ב-XLSX בלבד</li>
                <li>• בדיקות תקינות מקדימות</li>
                <li>• ללא פרסום אוטומטי</li>
              </ul>
            </div>
          </div>
        </Link>
      </div>

      {/* Import History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-gray-500" />
          <h2 className="text-xl font-semibold text-black">היסטוריית ייבוא</h2>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">טוען...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Download className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>אין היסטוריית ייבוא</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    תאריך
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    סוג ייבוא
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    שם קובץ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    סה"כ שורות
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    הצלחה
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    כישלון
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('he-IL')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getImportTypeLabel(log.importType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-black max-w-xs truncate">
                      {log.fileName}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">{log.totalRows}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        {log.successRows}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        {log.failedRows}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
