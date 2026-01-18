import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText, FileSpreadsheet } from 'lucide-react';
import { api } from '../../services/api';

interface PreviewRow {
  rowNumber: number;
  title: string;
  description: string;
  price: number | null;
  categorySlug: string;
  city: string;
  address: string;
  status: string;
  errors: string[];
}

interface PreviewData {
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicates: number;
  warnings: string[];
  preview: PreviewRow[];
}

export default function ImportAds() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [initialStatus, setInitialStatus] = useState<'PENDING' | 'DRAFT'>('PENDING');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate XLSX only
      const ext = selectedFile.name.toLowerCase().split('.').pop();
      if (ext !== 'xlsx' && ext !== 'xls') {
        setError('ייבוא נכסים דורש קובץ XLSX בלבד');
        return;
      }
      
      setFile(selectedFile);
      setPreviewData(null);
      setError(null);
      setSuccess(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        '/admin/import/properties/preview',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setPreviewData(response.data);
    } catch (err: any) {
      console.error('Preview error:', err);
      setError(err.response?.data?.error || 'שגיאה בטעינת הקובץ');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!previewData) return;

    // Filter only valid rows
    const validRows = previewData.preview.filter(row => row.status === 'תקין');

    if (validRows.length === 0) {
      setError('אין שורות תקינות לייבוא');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post(
        '/admin/import/properties/commit',
        {
          data: validRows,
          options: {
            initialStatus,
          },
        }
      );

      setSuccess(
        `ייבוא הושלם בהצלחה! ${response.data.successRows} מודעות נוצרו בסטטוס ${initialStatus === 'PENDING' ? 'ממתין לאישור' : 'טיוטה'}.`
      );
      setPreviewData(null);
      setFile(null);
    } catch (err: any) {
      console.error('Commit error:', err);
      setError(err.response?.data?.error || 'שגיאה בשמירת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewData(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">ייבוא נכסים מקובץ</h1>
        <p className="text-black mt-2">
          ייבוא מודעות נכסים מקובץ XLSX. כל מודעה תיווצר בסטטוס שתבחר (ממתין לאישור/טיוטה).
        </p>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 border-r-4 border-blue-400 p-4 mb-6">
        <div className="flex items-start gap-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800">שימו לב:</p>
            <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
              <li>הקובץ חייב להיות בפורמט XLSX בלבד</li>
              <li>עמודות חובה: title, description, categorySlug</li>
              <li>עמודות נוספות: price, city, address, userEmail, rooms, floor, size</li>
              <li>כל המודעות ייווצרו ללא פרסום אוטומטי</li>
            </ul>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      {!previewData && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-black mb-4">העלאת קובץ</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              בחר קובץ XLSX
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-[#1F3F3A] file:text-white
                hover:file:bg-[#1F3F3A]/90"
            />
          </div>

          {/* Import Options */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-black mb-3">סטטוס ראשוני למודעות</h3>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="PENDING"
                  checked={initialStatus === 'PENDING'}
                  onChange={(e) => setInitialStatus(e.target.value as 'PENDING')}
                  className="text-[#1F3F3A] focus:ring-[#1F3F3A]"
                />
                <span className="text-sm text-black">ממתין לאישור (מומלץ)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={initialStatus === 'DRAFT'}
                  onChange={(e) => setInitialStatus(e.target.value as 'DRAFT')}
                  className="text-[#1F3F3A] focus:ring-[#1F3F3A]"
                />
                <span className="text-sm text-black">טיוטה</span>
              </label>
            </div>
          </div>

          <button
            onClick={handlePreview}
            disabled={!file || loading}
            className="w-full bg-[#1F3F3A] text-white px-6 py-3 rounded-lg hover:bg-[#1F3F3A]/90 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            {loading ? 'טוען...' : 'העלה וצפה בתצוגה מקדימה'}
          </button>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-r-4 border-red-400 p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-r-4 border-green-400 p-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {previewData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-black mb-2">תצוגה מקדימה</h2>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{previewData.fileName}</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">סה"כ שורות</p>
              <p className="text-2xl font-bold text-blue-900">{previewData.totalRows}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">תקינות</p>
              <p className="text-2xl font-bold text-green-900">{previewData.validRows}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600">בעייתיות</p>
              <p className="text-2xl font-bold text-red-900">{previewData.invalidRows}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600">כפילויות</p>
              <p className="text-2xl font-bold text-yellow-900">{previewData.duplicates}</p>
            </div>
          </div>

          {/* Warnings */}
          {previewData.warnings.length > 0 && (
            <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">אזהרות</h3>
              <ul className="list-disc list-inside text-sm text-yellow-700">
                {previewData.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">שורה</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">כותרת</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">תיאור</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">מחיר</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">קטגוריה</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">שגיאות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.preview.slice(0, 50).map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={
                      row.status === 'שגוי'
                        ? 'bg-red-50'
                        : row.status === 'כפול'
                        ? 'bg-yellow-50'
                        : ''
                    }
                  >
                    <td className="px-4 py-3 text-sm text-black">{row.rowNumber}</td>
                    <td className="px-4 py-3 text-sm text-black">{row.title}</td>
                    <td className="px-4 py-3 text-sm text-black max-w-xs truncate">{row.description}</td>
                    <td className="px-4 py-3 text-sm text-black">
                      {row.price ? `₪${row.price.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">{row.categorySlug}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          row.status === 'תקין'
                            ? 'bg-green-100 text-green-800'
                            : row.status === 'כפול'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600">
                      {row.errors.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.preview.length > 50 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                מוצגות 50 שורות ראשונות מתוך {previewData.preview.length}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleCommit}
              disabled={loading || previewData.validRows === 0}
              className="flex-1 bg-[#1F3F3A] text-white px-6 py-3 rounded-lg hover:bg-[#1F3F3A]/90 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {loading ? 'מייבא...' : `אשר ייבוא (${previewData.validRows} מודעות)`}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
