  const handleReorder = async (id: string, direction: 'up' | 'down', parentId?: string) => {
    // parentId: undefined = קטגוריה ראשית, אחרת תת קטגוריה
    let list = parentId
      ? categories.find(c => c.id === parentId)?.other_Category || []
      : categories;
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    // החלפה
    const newList = [...list];
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    // עדכון סדר
    const orders = newList.map((c, i) => ({ id: c.id, order: i }));
    try {
      await adminService.adminCategoriesService.reorderCategories(orders);
      fetchCategories();
    } catch (e) {
      alert('שגיאה בסידור');
    }
  };
import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';

interface Category {
  id: string;
  name: string;
  nameHe: string;
  slug: string;
  order: number;
  isActive: boolean;
  Category?: Category | null; // Parent
  other_Category?: Category[]; // Subcategories
}

function CategoryForm({ onSave, onCancel, parentId, initial }: { onSave: (data: any) => void; onCancel: () => void; parentId?: string; initial?: any }) {
  const [name, setName] = useState(initial?.name || '');
  const [nameHe, setNameHe] = useState(initial?.nameHe || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [order, setOrder] = useState(initial?.order || 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nameHe || !slug) {
      setError('יש למלא את כל השדות');
      return;
    }
    onSave({ name, nameHe, slug, order, isActive, parentId });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border rounded shadow max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-2">{initial ? 'עריכת קטגוריה' : 'יצירת קטגוריה חדשה'}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="mb-2">
        <label className="block">שם (en):</label>
        <input className="border p-1 w-full" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="mb-2">
        <label className="block">שם (he):</label>
        <input className="border p-1 w-full" value={nameHe} onChange={e => setNameHe(e.target.value)} />
      </div>
      <div className="mb-2">
        <label className="block">Slug:</label>
        <input className="border p-1 w-full" value={slug} onChange={e => setSlug(e.target.value)} />
      </div>
      <div className="mb-2">
        <label className="block">סדר:</label>
        <input type="number" className="border p-1 w-full" value={order} onChange={e => setOrder(Number(e.target.value))} />
      </div>
      <div className="mb-2">
        <label className="inline-flex items-center">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
          <span className="ml-2">פעיל</span>
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">שמור</button>
        <button type="button" className="bg-gray-300 px-4 py-1 rounded" onClick={onCancel}>ביטול</button>
      </div>
    </form>
  );
}

const CategoriesManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
    const handleDeleteCategory = async (id: string) => {
      setDeleting(true);
      setDeleteError(null);
      try {
        await adminService.adminCategoriesService.deleteCategory(id);
        setShowDelete(null);
        fetchCategories();
      } catch (e: any) {
        setDeleteError(e?.response?.data?.error || 'שגיאה במחיקה');
      } finally {
        setDeleting(false);
      }
    };
  const handleEditCategory = async (id: string, data: any) => {
    setEditing(true);
    setEditError(null);
    try {
      await adminService.adminCategoriesService.updateCategory(id, data);
      setShowEdit(null);
      fetchCategories();
    } catch (e: any) {
      setEditError(e?.response?.data?.error || 'שגיאה בעדכון');
    } finally {
      setEditing(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.adminCategoriesService.getCategories();
      setCategories(data);
    } catch (e: any) {
      setError(e?.message || 'שגיאה בטעינת קטגוריות');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggleActive = async (cat: Category) => {
    try {
      await adminService.adminCategoriesService.updateCategory(cat.id, { isActive: !cat.isActive });
      fetchCategories();
    } catch (e) {
      alert('שגיאה בעדכון סטטוס');
    }
  };

  const handleCreateCategory = async (data: any) => {
    setCreating(true);
    setCreateError(null);
    try {
      await adminService.adminCategoriesService.createCategory(data);
      setShowCreate(false);
      fetchCategories();
    } catch (e: any) {
      setCreateError(e?.response?.data?.error || 'שגיאה ביצירה');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">ניהול קטגוריות ותתי קטגוריות</h1>
      <div className="mb-4">
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => setShowCreate(true)}>+ קטגוריה חדשה</button>
      </div>
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg relative">
            <CategoryForm onSave={handleCreateCategory} onCancel={() => setShowCreate(false)} />
            {creating && <div className="text-blue-600 mt-2">יוצר...</div>}
            {createError && <div className="text-red-600 mt-2">{createError}</div>}
          </div>
        </div>
      )}
      {loading && <div>טוען...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-right">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">#</th>
              <th className="p-2 border">שם</th>
              <th className="p-2 border">Slug</th>
              <th className="p-2 border">סדר</th>
              <th className="p-2 border">פעיל</th>
              <th className="p-2 border">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, i) => (
              <React.Fragment key={cat.id}>
                <tr className={cat.isActive ? '' : 'bg-gray-200'}>
                  <td className="p-2 border">{i + 1}</td>
                  <td className="p-2 border font-bold">{cat.nameHe} <span className="text-xs text-gray-500">({cat.name})</span></td>
                  <td className="p-2 border">{cat.slug}</td>
                  <td className="p-2 border">{cat.order}</td>
                  <td className="p-2 border">
                    <button className={cat.isActive ? 'text-green-600' : 'text-gray-400'} onClick={() => handleToggleActive(cat)}>
                      {cat.isActive ? 'פעיל' : 'מושבת'}
                    </button>
                  </td>
                  <td className="p-2 border space-x-2">
                    <button className="px-1" onClick={() => handleReorder(cat.id, 'up')}>⬆️</button>
                    <button className="px-1" onClick={() => handleReorder(cat.id, 'down')}>⬇️</button>
                    <button className="text-blue-600" onClick={() => setShowEdit(cat.id)}>ערוך</button>
                    <button className="text-red-600" onClick={() => setShowDelete(cat.id)}>מחק</button>
                  </td>
                </tr>
                {cat.other_Category && cat.other_Category.length > 0 && cat.other_Category.map((sub, j) => (
                  <tr key={sub.id} className="bg-gray-50">
                    <td className="p-2 border">{i + 1}.{j + 1}</td>
                    <td className="p-2 border pl-8">↳ {sub.nameHe} <span className="text-xs text-gray-500">({sub.name})</span></td>
                    <td className="p-2 border">{sub.slug}</td>
                    <td className="p-2 border">{sub.order}</td>
                    <td className="p-2 border">
                      <button className={sub.isActive ? 'text-green-600' : 'text-gray-400'} onClick={() => handleToggleActive(sub)}>
                        {sub.isActive ? 'פעיל' : 'מושבת'}
                      </button>
                    </td>
                    <td className="p-2 border space-x-2">
                      <button className="px-1" onClick={() => handleReorder(sub.id, 'up', cat.id)}>⬆️</button>
                      <button className="px-1" onClick={() => handleReorder(sub.id, 'down', cat.id)}>⬇️</button>
                      <button className="text-blue-600" onClick={() => setShowEdit(sub.id)}>ערוך</button>
                      <button className="text-red-600" onClick={() => setShowDelete(sub.id)}>מחק</button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoriesManager;
