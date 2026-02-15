import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappService, adminService } from '../../services/api';
import { Link } from 'react-router-dom';

interface WhatsAppGroup {
  id: string;
  name: string;
  inviteLink: string | null;
  status: string;
  dailyQuota: number;
  cityScopes: string[] | null;
  categoryScopes: string[] | null;
  Category: { id: string; nameHe: string } | null;
  City: { id: string; nameHe: string } | null;
  createdAt: string;
  _count?: {
    DistributionItem: number;
  };
}

interface GroupSuggestion {
  id: string;
  groupName: string;
  phoneNumber: string | null;
  inviteLink: string | null;
  description: string | null;
  status: string;
  suggestedBy: {
    fullName: string;
    email: string;
  };
  Category: { nameHe: string } | null;
  City: { nameHe: string } | null;
  createdAt: string;
}

export default function WhatsAppGroups() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WhatsAppGroup | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    inviteLink: '',
    categoryScopes: [] as string[],
    cityScopes: [] as string[],
    dailyQuota: 10,
  });

  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['whatsapp-groups'],
    queryFn: () => whatsappService.getGroups(),
  });

  const { data: suggestionsData } = useQuery({
    queryKey: ['whatsapp-suggestions'],
    queryFn: () => whatsappService.getSuggestions(),
  });

  // טעינת קטגוריות
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const result = await response.json();
      console.log('Categories data:', result);
      return result.data || [];
    },
  });

  // טעינת ערים
  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await fetch('/api/cities');
      if (!response.ok) throw new Error('Failed to fetch cities');
      const result = await response.json();
      console.log('Cities data:', result);
      return result.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => whatsappService.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-groups'] });
      setShowCreateForm(false);
      resetForm();
      alert('✅ קבוצה נוצרה בהצלחה');
    },
    onError: (error: any) => {
      alert(`❌ שגיאה: ${error.response?.data?.message || error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      whatsappService.updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-groups'] });
      setEditingGroup(null);
      resetForm();
      alert('✅ קבוצה עודכנה בהצלחה');
    },
    onError: (error: any) => {
      alert(`❌ שגיאה: ${error.response?.data?.message || error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => whatsappService.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-groups'] });
      alert('✅ קבוצה נמחקה בהצלחה');
    },
    onError: (error: any) => {
      alert(`❌ שגיאה: ${error.response?.data?.message || error.message}`);
    },
  });

  const approveSuggestionMutation = useMutation({
    mutationFn: (id: string) => whatsappService.approveSuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-groups'] });
      alert('✅ הצעה אושרה ונוצרה קבוצה');
    },
  });

  const rejectSuggestionMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      whatsappService.rejectSuggestion(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-suggestions'] });
      alert('✅ הצעה נדחתה');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      inviteLink: '',
      categoryScopes: [],
      cityScopes: [],
      dailyQuota: 10,
    });
  };

  const handleEdit = (group: WhatsAppGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      inviteLink: group.inviteLink || '',
      categoryScopes: Array.isArray(group.categoryScopes) ? group.categoryScopes : [],
      cityScopes: Array.isArray(group.cityScopes) ? group.cityScopes : [],
      dailyQuota: group.dailyQuota,
      status: group.status || 'ACTIVE',
    });
    setShowCreateForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (group: WhatsAppGroup) => {
    if (confirm(`האם למחוק את הקבוצה "${group.name}"?`)) {
      deleteMutation.mutate(group.id);
    }
  };

  const toggleStatus = (group: WhatsAppGroup) => {
    const newStatus = group.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    updateMutation.mutate({
      id: group.id,
      data: { status: newStatus },
    });
  };

  const groups: WhatsAppGroup[] = groupsData?.groups || [];
  const suggestions: GroupSuggestion[] = suggestionsData?.suggestions || [];
  const categories = categoriesData || [];
  const cities = citiesData || [];

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryScopes: prev.categoryScopes.includes(categoryId)
        ? prev.categoryScopes.filter(id => id !== categoryId)
        : [...prev.categoryScopes, categoryId]
    }));
  };

  const toggleCity = (cityId: string) => {
    setFormData(prev => ({
      ...prev,
      cityScopes: prev.cityScopes.includes(cityId)
        ? prev.cityScopes.filter(id => id !== cityId)
        : [...prev.cityScopes, cityId]
    }));
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'פעיל',
      PAUSED: 'מושהה',
      ARCHIVED: 'בארכיון',
      FULL: 'מלא',
      PENDING: 'ממתין',
      APPROVED: 'אושר',
      REJECTED: 'נדחה',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
      FULL: 'bg-orange-100 text-orange-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">👥 ניהול קבוצות WhatsApp</h1>
          <div className="flex gap-3">
            <Link
              to="/admin/whatsapp/queue"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              📱 תור הפצה
            </Link>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setEditingGroup(null);
                resetForm();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              ➕ קבוצה חדשה
            </button>
          </div>
        </div>

        {/* טופס יצירה/עריכה */}
        {showCreateForm && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingGroup ? 'עריכת קבוצה' : 'יצירת קבוצה חדשה'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם הקבוצה <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="למשל: דירות למכירה - ירושלים"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">קישור הזמנה לווטצאפ</label>
                  <input
                    type="url"
                    value={formData.inviteLink}
                    onChange={(e) => setFormData({ ...formData, inviteLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://chat.whatsapp.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מכסה יומית</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.dailyQuota}
                    onChange={(e) => setFormData({ ...formData, dailyQuota: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* בחירת קטגוריות */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  קטגוריות (ניתן לבחור מספר)
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {categoriesLoading ? (
                    <p className="text-sm text-gray-500">טוען קטגוריות...</p>
                  ) : categories.length === 0 ? (
                    <p className="text-sm text-gray-500">לא נמצאו קטגוריות</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {categories.map((category: any) => (
                        <label key={category.id} className="flex items-center space-x-2 space-x-reverse cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={formData.categoryScopes.includes(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{category.nameHe}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.categoryScopes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    נבחרו {formData.categoryScopes.length} קטגוריות
                  </p>
                )}
              </div>

              {/* בחירת ערים */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ערים (ניתן לבחור מספר)
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {citiesLoading ? (
                    <p className="text-sm text-gray-500">טוען ערים...</p>
                  ) : cities.length === 0 ? (
                    <p className="text-sm text-gray-500">לא נמצאו ערים</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {cities.map((city: any) => (
                        <label key={city.id} className="flex items-center space-x-2 space-x-reverse cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={formData.cityScopes.includes(city.id)}
                            onChange={() => toggleCity(city.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{city.nameHe}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.cityScopes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    נבחרו {formData.cityScopes.length} ערים
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {editingGroup ? '💾 שמור שינויים' : '✅ צור קבוצה'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingGroup(null);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        )}

        {/* הצעות ממתינות */}
        {suggestions.filter((s) => s.status === 'PENDING').length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-900 mb-3">💡 הצעות ממתינות לאישור</h3>
            <div className="space-y-3">
              {suggestions
                .filter((s) => s.status === 'PENDING')
                .map((suggestion) => (
                  <div key={suggestion.id} className="bg-white border border-yellow-300 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{suggestion.groupName}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          {suggestion.description && <div>{suggestion.description}</div>}
                          <div>
                            {suggestion.Category?.nameHe || 'ללא קטגוריה'} ·{' '}
                            {suggestion.City?.nameHe || 'ללא עיר'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            הוצע על ידי: {suggestion.suggestedBy.fullName} ({suggestion.suggestedBy.email})
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveSuggestionMutation.mutate(suggestion.id)}
                          disabled={approveSuggestionMutation.isPending}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          ✅ אשר
                        </button>
                        <button
                          onClick={() => rejectSuggestionMutation.mutate({ id: suggestion.id })}
                          disabled={rejectSuggestionMutation.isPending}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          ❌ דחה
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">קבוצות פעילות</div>
            <div className="text-2xl font-bold text-green-800">
              {groups.filter((g) => g.status === 'ACTIVE').length}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">לא פעילות</div>
            <div className="text-2xl font-bold text-gray-800">
              {groups.filter((g) => g.status === 'PAUSED' || g.status === 'ARCHIVED').length}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">סה"כ קבוצות</div>
            <div className="text-2xl font-bold text-blue-800">{groups.length}</div>
          </div>
        </div>
      </div>

      {/* טבלת קבוצות */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">טוען...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg">אין קבוצות</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">פילוח</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">מכסה יומית</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">מודעות שנשלחו</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {groups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{group.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          group.status
                        )}`}
                      >
                        {getStatusLabel(group.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-gray-600">
                        <div className="mb-1">
                          <span className="font-semibold">קטגוריות: </span>
                          {Array.isArray(group.categoryScopes) && group.categoryScopes.length > 0
                            ? categories
                                .filter((c: any) => group.categoryScopes?.includes(c.id))
                                .map((c: any) => c.nameHe)
                                .join(', ')
                            : 'כל הקטגוריות'}
                        </div>
                        <div>
                          <span className="font-semibold">ערים: </span>
                          {Array.isArray(group.cityScopes) && group.cityScopes.length > 0
                            ? cities
                                .filter((c: any) => group.cityScopes?.includes(c.id))
                                .map((c: any) => c.nameHe)
                                .join(', ')
                            : 'כל הערים'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{group.dailyQuota}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-blue-600">
                        {group._count?.DistributionItem || 0}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {group.inviteLink && (
                          <a
                            href={group.inviteLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="קישור הזמנה"
                          >
                            🔗
                          </a>
                        )}
                        <button
                          onClick={() => handleEdit(group)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="עריכה"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => toggleStatus(group)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title={group.status === 'ACTIVE' ? 'השבת' : 'הפעל'}
                        >
                          {group.status === 'ACTIVE' ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => handleDelete(group)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="מחיקה"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
