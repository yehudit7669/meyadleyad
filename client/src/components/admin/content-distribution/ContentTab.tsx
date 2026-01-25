import { useState, useEffect } from 'react';
import { Plus, ExternalLink, FileText, Link as LinkIcon, Trash2, Send, RefreshCw } from 'lucide-react';
import { contentDistributionService, ContentItem } from '../../../services/content-distribution.service';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../services/api';

export default function ContentTab() {
  const { user } = useAuth();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [showDistributeModal, setShowDistributeModal] = useState(false);

  const isReadOnly = user?.role === 'MODERATOR';

  useEffect(() => {
    loadContentItems();
  }, []);

  const loadContentItems = async () => {
    try {
      setLoading(true);
      const items = await contentDistributionService.getContentItems();
      setContentItems(items);
    } catch (error) {
      console.error('Failed to load content items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק פריט תוכן זה?')) return;

    try {
      await contentDistributionService.deleteContentItem(id);
      await loadContentItems();
    } catch (error) {
      console.error('Failed to delete content item:', error);
      alert('שגיאה במחיקת פריט התוכן');
    }
  };

  const handleDistribute = (item: ContentItem, mode: 'INITIAL' | 'REDISTRIBUTE' | 'PUSH') => {
    setSelectedItem(item);
    setShowDistributeModal(true);
    // Store the mode for later use
    (window as any).__distributionMode = mode;
  };

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">פריטי תוכן</h2>
        {!isReadOnly && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            הוסף תוכן
          </button>
        )}
      </div>

      {/* Content Items Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                שם
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                סוג
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                נוצר ב
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                תפוצה אחרונה
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                סטטוס
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                תצוגה מקדימה
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contentItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  אין פריטי תוכן. הוסף פריט תוכן ראשון!
                </td>
              </tr>
            ) : (
              contentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      {item.type === 'PDF' ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <LinkIcon className="w-4 h-4" />
                      )}
                      {item.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.lastDistributedAt
                      ? new Date(item.lastDistributedAt).toLocaleDateString('he-IL')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'NOT_DISTRIBUTED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.status === 'ACTIVE'
                        ? 'פעיל'
                        : item.status === 'NOT_DISTRIBUTED'
                        ? 'לא הופץ'
                        : 'ארכיון'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                      פתח
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {!isReadOnly && (
                      <div className="flex items-center gap-2">
                        {item.status === 'NOT_DISTRIBUTED' && (
                          <button
                            onClick={() => handleDistribute(item, 'INITIAL')}
                            className="text-blue-600 hover:text-blue-800"
                            title="תפוצה ראשונית"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {item.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleDistribute(item, 'REDISTRIBUTE')}
                              className="text-green-600 hover:text-green-800"
                              title="תפוצה מחדש"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDistribute(item, 'PUSH')}
                              className="text-purple-600 hover:text-purple-800"
                              title="דחיפה"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800"
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Content Modal */}
      {showAddModal && <AddContentModal onClose={() => setShowAddModal(false)} onSuccess={loadContentItems} />}

      {/* Distribute Modal */}
      {showDistributeModal && selectedItem && (
        <DistributeModal
          item={selectedItem}
          mode={(window as any).__distributionMode || 'INITIAL'}
          onClose={() => {
            setShowDistributeModal(false);
            setSelectedItem(null);
          }}
          onSuccess={loadContentItems}
        />
      )}
    </div>
  );
}

// Add Content Modal Component
function AddContentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'LINK' as 'PDF' | 'LINK',
    url: '',
    thumbnailUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate PDF
      if (file.type !== 'application/pdf') {
        alert('אנא בחר קובץ PDF בלבד');
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async (): Promise<string> => {
    if (!selectedFile) throw new Error('No file selected');

    const formData = new FormData();
    formData.append('file', selectedFile);

    const response = await api.post<{ url: string }>('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let finalUrl = formData.url;

      // If PDF type and file selected, upload it first
      if (formData.type === 'PDF' && selectedFile) {
        setUploading(true);
        finalUrl = await uploadFile();
        setUploading(false);
      }

      await contentDistributionService.createContentItem({
        title: formData.title,
        type: formData.type,
        url: finalUrl,
        thumbnailUrl: formData.thumbnailUrl || undefined,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create content item:', error);
      alert('שגיאה ביצירת פריט התוכן');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">הוסף תוכן חדש</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
            <select
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as 'PDF' | 'LINK';
                setFormData({ ...formData, type: newType, url: '' });
                setSelectedFile(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="LINK">קישור</option>
              <option value="PDF">PDF</option>
            </select>
          </div>

          {formData.type === 'LINK' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="https://example.com"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">קובץ PDF</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              {selectedFile && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תמונה ממוזערת (אופציונלי)</label>
            <input
              type="url"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={submitting || uploading}
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'מעלה קובץ...' : submitting ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Distribute Modal Component
function DistributeModal({
  item,
  mode,
  onClose,
  onSuccess,
}: {
  item: ContentItem;
  mode: 'INITIAL' | 'REDISTRIBUTE' | 'PUSH';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [distributing, setDistributing] = useState(false);

  const modeLabels = {
    INITIAL: 'תפוצה ראשונית',
    REDISTRIBUTE: 'תפוצה מחדש',
    PUSH: 'דחיפה',
  };

  const handleDistribute = async () => {
    setDistributing(true);

    try {
      const result = await contentDistributionService.distributeContent({
        contentItemId: item.id,
        mode,
      });

      alert(
        `התוכן הופץ בהצלחה!\n` +
          `סה"כ נמענים: ${result.totalRecipients}\n` +
          `הצלחות: ${result.successCount}\n` +
          `כשלונות: ${result.failedCount}`
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to distribute content:', error);
      alert('שגיאה בתפוצת התוכן');
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">{modeLabels[mode]}</h3>
        <p className="text-gray-600 mb-4">
          האם אתה בטוח שברצונך להפיץ את התוכן "{item.title}" לכל המנויים הפעילים?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            onClick={handleDistribute}
            disabled={distributing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {distributing ? 'מפיץ...' : 'אישור תפוצה'}
          </button>
        </div>
      </div>
    </div>
  );
}
