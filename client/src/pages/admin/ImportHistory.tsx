import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { importHistoryService } from '../../services/api';
import { History, FileText, Trash2, Eye, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ImportLog {
  id: string;
  adminId: string;
  importType: string;
  fileName: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors: any;
  importedItemIds: string[];
  metadata: any;
  createdAt: string;
}

export default function ImportHistoryPage() {
  const [page, setPage] = useState(1);
  const [importTypeFilter, setImportTypeFilter] = useState('');
  const [selectedImport, setSelectedImport] = useState<ImportLog | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState({
    includeApproved: false,
    deleteWithApprovedAds: false,
  });
  const [approvedCheck, setApprovedCheck] = useState<any>(null);
  
  const queryClient = useQueryClient();

  // Fetch import history
  const { data, isLoading } = useQuery({
    queryKey: ['import-history', page, importTypeFilter],
    queryFn: () => importHistoryService.getImportHistory({
      page,
      limit: 20,
      importType: importTypeFilter || undefined,
    }),
  });

  const imports = data?.imports || [];
  const pagination = data?.pagination;

  const getImportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'PROPERTIES': 'ייבוא נכסים',
      'PROPERTIES_FILE': 'ייבוא נכסים מקובץ',
      'CITIES_STREETS': 'ייבוא ערים ורחובות',
    };
    return labels[type] || type;
  };

  const handleDeleteClick = async (importLog: ImportLog) => {
    setSelectedImport(importLog);
    setDeleteOptions({
      includeApproved: false,
      deleteWithApprovedAds: false,
    });

    // Check if import has approved items
    try {
      if (importLog.importType === 'CITIES_STREETS') {
        const result = await importHistoryService.checkApprovedAdsCitiesStreets(importLog.id);
        setApprovedCheck(result);
      } else if (importLog.importType === 'PROPERTIES' || importLog.importType === 'PROPERTIES_FILE') {
        const result = await importHistoryService.checkApprovedProperties(importLog.id);
        setApprovedCheck(result);
      }
    } catch (error) {
      console.error('Error checking approved items:', error);
    }

    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedImport) return;

    try {
      if (selectedImport.importType === 'CITIES_STREETS') {
        await importHistoryService.deleteImportedCitiesStreets(
          selectedImport.id,
          deleteOptions.deleteWithApprovedAds
        );
      } else {
        await importHistoryService.deleteImportedProperties(
          selectedImport.id,
          deleteOptions.includeApproved
        );
      }

      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      
      setShowDeleteModal(false);
      setSelectedImport(null);
      setApprovedCheck(null);
      
      alert('הייבוא נמחק בהצלחה');
    } catch (error: any) {
      console.error('Error deleting import:', error);
      alert('שגיאה במחיקת הייבוא: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleViewDetails = (importLog: ImportLog) => {
    setSelectedImport(importLog);
    setShowDetailsModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
          <History className="w-6 h-6" />
          היסטוריית ייבוא
        </h1>
        <p className="text-gray-600 mt-2">
          צפייה וניהול של כל הייבואים שבוצעו במערכת
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-black">סנן לפי סוג:</label>
          <select
            value={importTypeFilter}
            onChange={(e) => {
              setImportTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F3F3A]"
          >
            <option value="">הכל</option>
            <option value="PROPERTIES">ייבוא נכסים</option>
            <option value="PROPERTIES_FILE">ייבוא נכסים מקובץ</option>
            <option value="CITIES_STREETS">ייבוא ערים ורחובות</option>
          </select>
        </div>
      </div>

      {/* Import List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                תאריך
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                סוג ייבוא
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                שם קובץ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                סה״כ שורות
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                הצלחות
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                כשלונות
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {imports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  אין היסטוריית ייבוא
                </td>
              </tr>
            ) : (
              imports.map((importLog: ImportLog) => (
                <tr key={importLog.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(importLog.createdAt).toLocaleString('he-IL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getImportTypeLabel(importLog.importType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {importLog.fileName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {importLog.totalRows}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      {importLog.successRows}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <XCircle className="w-4 h-4" />
                      {importLog.failedRows}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(importLog)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        title="צפייה בפרטים"
                      >
                        <Eye className="w-4 h-4" />
                        צפה
                      </button>
                      <button
                        onClick={() => handleDeleteClick(importLog)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        title="מחיקת ייבוא"
                      >
                        <Trash2 className="w-4 h-4" />
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-[#1F3F3A] text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            הקודם
          </button>
          <span className="px-4 py-2 text-black">
            עמוד {page} מתוך {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 bg-[#1F3F3A] text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            הבא
          </button>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#1F3F3A]" />
                <h3 className="text-xl font-bold text-black">פרטי ייבוא</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-black mb-3">מידע כללי</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">סוג ייבוא:</span>
                    <p className="font-medium text-black">{getImportTypeLabel(selectedImport.importType)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">שם קובץ:</span>
                    <p className="font-medium text-black">{selectedImport.fileName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">תאריך ייבוא:</span>
                    <p className="font-medium text-black">
                      {new Date(selectedImport.createdAt).toLocaleString('he-IL')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">מזהה ייבוא:</span>
                    <p className="font-medium text-black font-mono text-xs">{selectedImport.id}</p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-black mb-3">סטטיסטיקות</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-gray-600 text-sm mb-1">סה״כ שורות</p>
                    <p className="text-2xl font-bold text-black">{selectedImport.totalRows}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-green-700 text-sm mb-1 flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      הצלחות
                    </p>
                    <p className="text-2xl font-bold text-green-600">{selectedImport.successRows}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-red-700 text-sm mb-1 flex items-center justify-center gap-1">
                      <XCircle className="w-4 h-4" />
                      כשלונות
                    </p>
                    <p className="text-2xl font-bold text-red-600">{selectedImport.failedRows}</p>
                  </div>
                </div>
              </div>

              {/* Imported Items */}
              {selectedImport.importedItemIds && selectedImport.importedItemIds.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-black mb-3">פריטים שיובאו</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedImport.importType === 'PROPERTIES' || selectedImport.importType === 'PROPERTIES_FILE'
                      ? `${selectedImport.importedItemIds.length} מודעות נוצרו בייבוא זה`
                      : `${selectedImport.importedItemIds.length} פריטים נוצרו`}
                  </p>
                  <div className="bg-white rounded p-3 max-h-40 overflow-y-auto">
                    <div className="space-y-1">
                      {selectedImport.importedItemIds.slice(0, 50).map((id: string, index: number) => (
                        <div key={id} className="text-xs font-mono text-gray-700 flex items-center gap-2">
                          <span className="text-gray-400">{index + 1}.</span>
                          <span>{id}</span>
                        </div>
                      ))}
                      {selectedImport.importedItemIds.length > 50 && (
                        <p className="text-xs text-gray-500 italic mt-2">
                          ועוד {selectedImport.importedItemIds.length - 50} פריטים...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedImport.metadata && Object.keys(selectedImport.metadata).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-black mb-3">מטא-דאטה</h4>
                  <div className="bg-white rounded p-3">
                    {selectedImport.metadata.createdCityIds && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-black">ערים שנוצרו:</p>
                        <p className="text-xs text-gray-600">
                          {Array.isArray(selectedImport.metadata.createdCityIds)
                            ? selectedImport.metadata.createdCityIds.join(', ')
                            : selectedImport.metadata.createdCityIds}
                        </p>
                      </div>
                    )}
                    {selectedImport.metadata.createdStreetIds && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-black">רחובות שנוצרו:</p>
                        <p className="text-xs text-gray-600">
                          {Array.isArray(selectedImport.metadata.createdStreetIds)
                            ? `${selectedImport.metadata.createdStreetIds.length} רחובות`
                            : selectedImport.metadata.createdStreetIds}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Errors */}
              {selectedImport.errors && Array.isArray(selectedImport.errors) && selectedImport.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    שגיאות ({selectedImport.errors.length})
                  </h4>
                  <div className="bg-white rounded p-3 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {selectedImport.errors.map((error: any, index: number) => (
                        <div key={index} className="border-r-2 border-red-300 pr-3 py-2">
                          <p className="text-sm font-medium text-red-900">
                            שורה {error.row || error.line || index + 1}
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            {error.message || error.error || JSON.stringify(error)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-[#1F3F3A] text-white rounded-lg hover:bg-[#152e2b] transition font-semibold"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" dir="rtl">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-black">אישור מחיקת ייבוא</h3>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                האם אתה בטוח שברצונך למחוק את הייבוא הבא?
              </p>
              <div className="bg-gray-100 p-3 rounded-lg mb-4">
                <p><strong>סוג:</strong> {getImportTypeLabel(selectedImport.importType)}</p>
                <p><strong>שורות שהצליחו:</strong> {selectedImport.successRows}</p>
                <p><strong>שורות שנכשלו:</strong> {selectedImport.failedRows}</p>
              </div>

              {/* Show warning if approved items exist */}
              {approvedCheck && approvedCheck.hasApproved && (
                <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-800 font-semibold mb-2">
                        {selectedImport.importType === 'CITIES_STREETS' 
                          ? `קיימים ${approvedCheck.approvedCount} נכסים מאושרים שמשתמשים בערים/רחובות אלו!`
                          : `קיימים ${approvedCheck.approvedCount} נכסים מאושרים מייבוא זה!`
                        }
                      </p>
                      
                      {selectedImport.importType === 'CITIES_STREETS' ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deleteOptions.deleteWithApprovedAds}
                            onChange={(e) => setDeleteOptions({
                              ...deleteOptions,
                              deleteWithApprovedAds: e.target.checked
                            })}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm text-yellow-800">
                            למחוק את הערים/רחובות כולל הנכסים המאושרים ({approvedCheck.approvedCount} נכסים)
                          </span>
                        </label>
                      ) : (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deleteOptions.includeApproved}
                            onChange={(e) => setDeleteOptions({
                              ...deleteOptions,
                              includeApproved: e.target.checked
                            })}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm text-yellow-800">
                            למחוק גם נכסים מאושרים ({approvedCheck.approvedCount} נכסים)
                          </span>
                        </label>
                      )}

                      {!deleteOptions.includeApproved && !deleteOptions.deleteWithApprovedAds && (
                        <p className="text-xs text-yellow-700 mt-2">
                          {selectedImport.importType === 'CITIES_STREETS'
                            ? 'רק ערים/רחובות ללא נכסים מאושרים יימחקו'
                            : `רק ${approvedCheck.pendingCount} נכסים לא מאושרים יימחקו`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition font-semibold"
              >
                מחק ייבוא
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedImport(null);
                  setApprovedCheck(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
