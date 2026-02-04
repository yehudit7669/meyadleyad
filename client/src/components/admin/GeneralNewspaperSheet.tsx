/**
 * GeneralNewspaperSheet Component
 * כפתור ליצירת לוח מודעות כללי
 */

import { useState } from 'react';
import { Newspaper, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export default function GeneralNewspaperSheet() {
  const [orderBy, setOrderBy] = useState<'city' | 'category'>('city');
  const [loading, setLoading] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePDF = async () => {
    setLoading(true);
    setPdfPath(null);
    setError(null);

    try {
      const response = await api.post('/admin/newspaper-sheets/general/generate-pdf', {
        orderBy
      });

      const data = response.data as { pdfPath: string };
      setPdfPath(data.pdfPath);

      // פתח את ה-PDF בחלון חדש
      window.open(data.pdfPath, '_blank');

    } catch (err) {
      console.error('Error generating general sheet:', err);
      setError('אירעה שגיאה ביצירת לוח המודעות הכללי');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1F3F3A] to-[#2d5a52] p-6">
        <div className="flex items-center gap-3 text-white">
          <Newspaper className="w-8 h-8 text-[#C9943D]" />
          <div>
            <h2 className="text-2xl font-bold">לוח מודעות כללי</h2>
            <p className="text-gray-200 text-sm mt-1">
              צור קובץ PDF אחד המכיל את כל הנכסים מכל הקטגוריות והערים
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Order By Selection */}
        <div className="space-y-3">
          <label className="block text-base font-semibold text-gray-900">
            סדר הדפים:
          </label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: orderBy === 'city' ? '#C9943D' : '#e5e7eb' }}>
              <input
                type="radio"
                name="orderBy"
                value="city"
                checked={orderBy === 'city'}
                onChange={(e) => setOrderBy(e.target.value as 'city' | 'category')}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">לפי עיר</div>
                <div className="text-sm text-gray-500">
                  כל הקטגוריות של כל עיר מקובצות יחד
                </div>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: orderBy === 'category' ? '#C9943D' : '#e5e7eb' }}>
              <input
                type="radio"
                name="orderBy"
                value="category"
                checked={orderBy === 'category'}
                onChange={(e) => setOrderBy(e.target.value as 'city' | 'category')}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">לפי קטגוריה</div>
                <div className="text-sm text-gray-500">
                  כל הערים של כל קטגוריה מקובצות יחד
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-blue-900">ℹ️ מידע על הלוח הכללי:</div>
          <ul className="text-sm text-blue-800 space-y-1 mr-4">
            <li>• עמוד ראשון: כותרת "לוח מודעות כללי"</li>
            <li>• דפים נוספים: רק המודעות עם סרגל צד (עיר + קטגוריה)</li>
            <li>• הלוח מתעדכן אוטומטית עם כל הנכסים האחרונים</li>
            <li>• ניתן להוריד את ה-PDF או לפתוח בחלון חדש</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <div className="text-red-600 font-medium">{error}</div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGeneratePDF}
          disabled={loading}
          className="w-full bg-[#C9943D] hover:bg-[#B8832C] disabled:bg-gray-300 text-white font-semibold text-lg py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              מייצר לוח כללי...
            </>
          ) : (
            <>
              <Newspaper className="h-5 w-5" />
              צור לוח מודעות כללי
            </>
          )}
        </button>

        {/* Success Message with Download Link */}
        {pdfPath && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-green-900">הלוח הכללי נוצר בהצלחה!</div>
                <div className="text-sm text-green-700">ה-PDF נפתח בחלון חדש</div>
              </div>
            </div>
            <button
              onClick={() => window.open(pdfPath, '_blank')}
              className="border border-green-300 text-green-700 hover:bg-green-100 px-4 py-2 rounded-md transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              הורד שוב
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
