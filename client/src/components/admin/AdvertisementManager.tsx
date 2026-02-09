import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

interface Advertisement {
  id: string;
  imageUrl: string;
  size: '1x1' | '2x1' | '3x1' | '2x2';
  anchorType: 'beforeIndex' | 'pagePosition';
  beforeListingId?: string;
  page?: number;
  row?: number;
  col?: number;
}

interface Listing {
  id: string;
  listingId: string;
  listing: {
    id: string;
    title: string;
    address: string;
  };
}

interface AdvertisementManagerProps {
  sheetId: string;
  advertisements: Advertisement[];
  listings: Listing[];
  onUpdate: () => void;
}

export default function AdvertisementManager({
  sheetId,
  advertisements,
  listings,
  onUpdate
}: AdvertisementManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [imageUrl, setImageUrl] = useState('');
  const [size, setSize] = useState<'1x1' | '2x1' | '3x1' | '2x2'>('1x1');
  const [anchorType, setAnchorType] = useState<'beforeIndex' | 'pagePosition'>('beforeIndex');
  const [beforeListingId, setBeforeListingId] = useState('');
  const [page, setPage] = useState(1);
  const [row, setRow] = useState(1);
  const [col, setCol] = useState(1);

  // Reset form
  const resetForm = () => {
    setImageUrl('');
    setSize('1x1');
    setAnchorType('beforeIndex');
    setBeforeListingId('');
    setPage(1);
    setRow(1);
    setCol(1);
    setIsAddingNew(false);
    setEditingAdId(null);
  };

  // Load ad data for editing
  const handleEdit = (ad: Advertisement) => {
    setEditingAdId(ad.id);
    setImageUrl(ad.imageUrl);
    setSize(ad.size);
    setAnchorType(ad.anchorType);
    setBeforeListingId(ad.beforeListingId || '');
    setPage(ad.page || 1);
    setRow(ad.row || 1);
    setCol(ad.col || 1);
    setIsAddingNew(false);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post<{ url: string }>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setImageUrl(response.data.url);
    } catch (error: any) {
      alert(`❌ שגיאה בהעלאת תמונה: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle save (add or update)
  const handleSave = async () => {
    if (!imageUrl) {
      alert('❌ יש לבחור תמונה');
      return;
    }

    const data: any = {
      imageUrl,
      size,
      anchorType
    };

    if (anchorType === 'beforeIndex') {
      if (!beforeListingId) {
        alert('❌ יש לבחור נכס לעוגן');
        return;
      }
      data.beforeListingId = beforeListingId;
    } else {
      data.page = page;
      data.row = row;
      data.col = col;
    }

    try {
      if (editingAdId) {
        // Update existing ad
        await api.put(`/admin/newspaper-sheets/${sheetId}/ads/${editingAdId}`, data);
      } else {
        // Add new ad
        await api.post(`/admin/newspaper-sheets/${sheetId}/ads`, data);
      }
      resetForm();
      onUpdate();
    } catch (error: any) {
      console.error('Error saving advertisement:', error);
    }
  };

  // Handle delete
  const handleDelete = async (adId: string) => {
    if (!window.confirm('האם למחוק פרסומת זו?')) return;

    try {
      await api.delete(`/admin/newspaper-sheets/${sheetId}/ads/${adId}`);
      onUpdate();
    } catch (error: any) {
      alert(`❌ שגיאה במחיקה: ${error.response?.data?.error || error.message}`);
    }
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return `${baseUrl}${url}`;
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full p-4 shadow-lg z-50 flex items-center gap-2"
        title="ניהול פרסומות"
      >
        <Plus className="w-6 h-6" />
        <span className="font-medium">פרסומות</span>
      </button>

      {/* Modal */}
      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">ניהול פרסומות</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Add New Button */}
              {!isAddingNew && !editingAdId && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="w-full mb-6 py-3 border-2 border-dashed border-yellow-400 hover:border-yellow-600 rounded-lg text-yellow-600 hover:text-yellow-700 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  הוסף פרסומת חדשה
                </button>
              )}

              {/* Add/Edit Form */}
              {(isAddingNew || editingAdId) && (
                <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    {editingAdId ? 'עריכת פרסומת' : 'פרסומת חדשה'}
                  </h3>

                  <div className="space-y-4">
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        תמונת פרסומת
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-yellow-50 file:text-yellow-700
                          hover:file:bg-yellow-100"
                      />
                      {imageUrl && (
                        <div className="mt-3">
                          <img
                            src={getImageUrl(imageUrl)}
                            alt="Preview"
                            className="max-w-xs rounded border border-gray-300"
                          />
                        </div>
                      )}
                    </div>

                    {/* Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        גודל (בתאי גריד)
                      </label>
                      <select
                        value={size}
                        onChange={(e) => setSize(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                      >
                        <option value="1x1">1×1 (קוביה אחת)</option>
                        <option value="2x1">2×1 (2 קוביות לרוחב)</option>
                        <option value="3x1">3×1 (3 קוביות לרוחב - שורה מלאה)</option>
                        <option value="2x2">2×2 (4 קוביות - ריבוע)</option>
                      </select>
                    </div>

                    {/* Anchor Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        סוג מיקום
                      </label>
                      <select
                        value={anchorType}
                        onChange={(e) => setAnchorType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                      >
                        <option value="beforeIndex">לפני נכס מסוים</option>
                        <option value="pagePosition">מיקום מדויק (עמוד/שורה/עמודה)</option>
                      </select>
                    </div>

                    {/* Before Listing (if beforeIndex) */}
                    {anchorType === 'beforeIndex' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          לפני נכס
                        </label>
                        <select
                          value={beforeListingId}
                          onChange={(e) => setBeforeListingId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        >
                          <option value="">בחר נכס...</option>
                          {listings.map((listing) => (
                            <option key={listing.listingId} value={listing.listingId}>
                              {listing.listing.address || listing.listing.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Page Position (if pagePosition) */}
                    {anchorType === 'pagePosition' && (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            עמוד
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={page}
                            onChange={(e) => setPage(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            שורה (1-7)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="7"
                            value={row}
                            onChange={(e) => setRow(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            עמודה (1-3)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="3"
                            value={col}
                            onChange={(e) => setCol(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSave}
                        disabled={isUploading}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
                      >
                        {editingAdId ? 'עדכן' : 'הוסף'}
                      </button>
                      <button
                        onClick={resetForm}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md font-medium"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Advertisements List */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  פרסומות קיימות ({advertisements.length})
                </h3>
                {advertisements.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">אין פרסומות בגיליון זה</p>
                ) : (
                  <div className="space-y-3">
                    {advertisements.map((ad) => (
                      <div
                        key={ad.id}
                        className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        {/* Preview */}
                        <img
                          src={getImageUrl(ad.imageUrl)}
                          alt="Ad preview"
                          className="w-20 h-20 object-cover rounded border border-gray-300"
                        />

                        {/* Info */}
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            גודל: {ad.size}
                          </div>
                          <div className="text-sm text-gray-600">
                            {ad.anchorType === 'beforeIndex' ? (
                              <>לפני נכס</>
                            ) : (
                              <>עמוד {ad.page}, שורה {ad.row}, עמודה {ad.col}</>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(ad)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                            title="ערוך"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                            title="מחק"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
