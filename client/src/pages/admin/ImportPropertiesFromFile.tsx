import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText, Download, FileSpreadsheet } from 'lucide-react';
import { api } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '../../services/api';
import * as XLSX from 'xlsx';

interface PreviewRow {
  rowNumber: number;
  [key: string]: any;
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

export default function ImportPropertiesFromFile() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedAdType, setSelectedAdType] = useState<'REGULAR' | 'WANTED'>('REGULAR');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [initialStatus, setInitialStatus] = useState<'PENDING' | 'DRAFT'>('PENDING');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
  });

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
    setFile(null);
    setPreviewData(null);
    setError(null);
    setSuccess(null);
  };

  const handleAdTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAdType(e.target.value as 'REGULAR' | 'WANTED');
    setFile(null);
    setPreviewData(null);
    setError(null);
    setSuccess(null);
  };

  const getCategorySlug = (): string => {
    const category = categories?.find((cat: any) => cat.id === selectedCategoryId);
    return category?.slug || '';
  };

  const showAdTypeSelector = (): boolean => {
    const slug = getCategorySlug();
    return slug.includes('sale') || slug.includes('rent') || slug.includes('shabbat') || slug.includes('שבת') || slug.includes('holiday') || slug.includes('commercial') || slug.includes('מסחרי');
  };

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

  const handleDownloadTemplate = () => {
    if (!selectedCategoryId) {
      setError('נא לבחור קטגוריה תחילה');
      return;
    }

    const category = categories?.find((cat: any) => cat.id === selectedCategoryId);
    if (!category) return;

    const templateData = getTemplateForCategory(category.slug, selectedAdType);
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'תבנית');
    
    const fileName = `template-${category.slug}-${selectedAdType === 'WANTED' ? 'wanted' : 'regular'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getTemplateForCategory = (categorySlug: string, adType: 'REGULAR' | 'WANTED'): any[] => {
    const slug = categorySlug.toLowerCase();
    
    // APARTMENTS FOR SALE - REGULAR
    if (slug.includes('sale') && adType === 'REGULAR') {
      return [{
        'תיווך': 'כן',
        'עיר': 'ירושלים',
        'רחוב': 'הרצל',
        'מספר בית': '15',
        'סוג הנכס': 'דירה',
        'מספר חדרים': '4.5',
        'שטח במר': '100',
        'מצב הנכס': 'משופץ',
        'קומה': '2',
        'מספר מרפסות': '1',
        'ריהוט': 'חלקי',
        'תאריך כניסה': '01/06/2026',
        'מחיר': '1800000',
        'ארנונה': '500',
        'ועד בית': '300',
        'חניה': 'כן',
        'מחסן': 'לא',
        'ממד': 'כן',
        'מרפסת סוכה': 'כן',
        'מעלית': 'כן',
        'נוף': 'לא',
        'יחידת הורים': 'כן',
        'יחידת דיור': 'לא',
        'חצר': 'לא',
        'מיזוג': 'כן',
        'אופציה': 'כן',
        'תיאור הנכס': 'דירת 4.5 חדרים מרווחת ומשופצת, קומה 2 עם מעלית',
        'שם': 'ישראל ישראלי',
        'טלפון': '050-1234567',
        'תמונה 1': 'https://example.com/image1.jpg',
        'תמונה 2': 'https://example.com/image2.jpg',
        'תמונה 3': 'https://example.com/image3.jpg',
      }];
    }
    
    // APARTMENTS FOR SALE - WANTED
    if (slug.includes('sale') && adType === 'WANTED') {
      return [{
        'תיווך': 'לא',
        'רחוב / אזור מבוקש': 'רחוב הרצל או סביבה',
        'סוג הנכס': 'דירה',
        'מספר חדרים': '4',
        'שטח במר': '90',
        'קומה': '1-3',
        'מרפסות': '1',
        'מצב הנכס': 'משופץ',
        'ריהוט': 'ללא',
        'מחיר': '1500000',
        'ארנונה': '400',
        'ועד בית': '250',
        'תאריך כניסה': '01/07/2026',
        'חניה': 'כן',
        'מחסן': 'לא',
        'נוף': 'לא',
        'מיזוג': 'כן',
        'מרפסת סוכה': 'כן',
        'יחידת הורים': 'לא',
        'ממד': 'כן',
        'חצר': 'לא',
        'יחידת דיור': 'לא',
        'מעלית': 'כן',
        'אופציה': 'לא',
        'שם': 'מוישה כהן',
        'טלפון': '052-9876543',
      }];
    }
    
    // APARTMENTS FOR RENT - REGULAR
    if (slug.includes('rent') && adType === 'REGULAR') {
      return [{
        'תיווך': 'לא',
        'עיר': 'תל אביב',
        'רחוב': 'דיזנגוף',
        'מספר בית': '120',
        'סוג הנכס': 'דירה',
        'מספר חדרים': '3',
        'שטח במר': '75',
        'מצב הנכס': 'חדש',
        'קומה': '5',
        'מספר מרפסות': '1',
        'ריהוט': 'מלא',
        'תאריך כניסה': '01/05/2026',
        'מחיר': '6500',
        'ארנונה': '300',
        'ועד בית': '200',
        'חניה': 'כן',
        'מחסן': 'כן',
        'ממד': 'כן',
        'מרפסת סוכה': 'לא',
        'מעלית': 'כן',
        'נוף': 'כן',
        'יחידת הורים': 'כן',
        'יחידת דיור': 'לא',
        'חצר': 'לא',
        'מיזוג': 'כן',
        'תיאור הנכס': 'דירת 3 חדרים מרוהטת במלואה בלב העיר',
        'שם': 'רחל לוי',
        'טלפון': '054-1112233',
        'תמונה 1': 'https://example.com/image1.jpg',
        'תמונה 2': '',
        'תמונה 3': '',
      }];
    }
    
    // APARTMENTS FOR RENT - WANTED
    if (slug.includes('rent') && adType === 'WANTED') {
      return [{
        'תיווך': 'כן',
        'רחוב / אזור מבוקש': 'צפון תל אביב',
        'סוג הנכס': 'דירה',
        'מספר חדרים': '3',
        'שטח במר': '',
        'קומה': '',
        'מרפסות': '',
        'מצב הנכס': '',
        'ריהוט': 'מלא',
        'מחיר': '7000',
        'ארנונה': '',
        'ועד בית': '',
        'תאריך כניסה': '01/06/2026',
        'חניה': 'כן',
        'מחסן': 'לא',
        'נוף': 'לא',
        'מיזוג': 'כן',
        'מרפסת סוכה': 'לא',
        'יחידת הורים': 'לא',
        'ממד': 'כן',
        'חצר': 'לא',
        'יחידת דיור': 'לא',
        'מעלית': 'כן',
        'שם': 'דוד דוידי',
        'טלפון': '053-4445566',
      }];
    }
    
    // SHABBAT APARTMENTS
    if (slug.includes('shabbat') || slug.includes('holiday')) {
      if (adType === 'WANTED') {
        return [{
          'רחוב / אזור מבוקש': 'גילה או סביבה',
          'בתשלום': 'לא',
          'פרשה': 'בראשית',
          'סוג הנכס': 'דירה',
          'מספר חדרים': '5',
          'מטרה': '',
          'קומה': '',
          'מספר מרפסות': '',
          'פלטה': 'כן',
          'מיחם': 'כן',
          'נוף': '',
          'מצעים': 'כן',
          'מיזוג': 'כן',
          'מרפסת': '',
          'בריכה': '',
          'חצר': 'כן',
          'משחקי ילדים': '',
          'מיטת תינוק': '',
          'יחידת הורים': '',
          'לינה בלבד': '',
          'מחיר': '',
          'שם': 'אברהם אברהמי',
          'טלפון': '02-6543210',
        }];
      }
      return [{
        'רחוב / אזור מבוקש': 'גילה',
        'בתשלום': 'לא',
        'פרשה': 'בראשית',
        'סוג הנכס': 'דירה',
        'מספר חדרים': '5',
        'מטרה': 'אירוח',
        'קומה': '1',
        'מספר מרפסות': '1',
        'פלטה': 'כן',
        'מיחם': 'כן',
        'נוף': 'לא',
        'מצעים': 'כן',
        'מיזוג': 'כן',
        'מרפסת': 'כן',
        'בריכה': 'לא',
        'חצר': 'כן',
        'משחקי ילדים': 'כן',
        'מיטת תינוק': 'כן',
        'יחידת הורים': 'כן',
        'לינה בלבד': 'לא',
        'מחיר': '',
        'שם': 'אברהם אברהמי',
        'טלפון': '02-6543210',
      }];
    }
    
    // HOUSING UNITS - Same as apartments for rent
    if (slug.includes('housing') || slug.includes('יחידות')) {
      if (adType === 'WANTED') {
        return [{
          'תיווך': 'כן',
          'רחוב / אזור מבוקש': 'צפון תל אביב',
          'סוג הנכס': 'דירה',
          'מספר חדרים': '3',
          'שטח במר': '',
          'קומה': '',
          'מרפסות': '',
          'מצב הנכס': '',
          'ריהוט': 'מלא',
          'מחיר': '7000',
          'ארנונה': '',
          'ועד בית': '',
          'תאריך כניסה': '01/06/2026',
          'חניה': 'כן',
          'מחסן': 'לא',
          'נוף': 'לא',
          'מיזוג': 'כן',
          'מרפסת סוכה': 'לא',
          'יחידת הורים': 'לא',
          'ממד': 'כן',
          'חצר': 'לא',
          'יחידת דיור': 'לא',
          'מעלית': 'כן',
          'שם': 'דוד דוידי',
          'טלפון': '053-4445566',
        }];
      }
      return [{
        'תיווך': 'לא',
        'עיר': 'תל אביב',
        'רחוב': 'דיזנגוף',
        'מספר בית': '50',
        'סוג הנכס': 'דירה',
        'מספר חדרים': '3',
        'שטח במר': '80',
        'מצב הנכס': 'חדש',
        'קומה': '3',
        'מספר מרפסות': '1',
        'ריהוט': 'מלא',
        'תאריך כניסה': '01/05/2026',
        'מחיר': '6500',
        'ארנונה': '400',
        'ועד בית': '200',
        'חניה': 'כן',
        'מחסן': 'לא',
        'ממד': 'כן',
        'מרפסת סוכה': 'כן',
        'מעלית': 'כן',
        'נוף': 'כן',
        'יחידת הורים': 'כן',
        'יחידת דיור': 'לא',
        'חצר': 'לא',
        'מיזוג': 'כן',
        'תיאור הנכס': 'דירת 3 חדרים מרוהטת במלואה בלב העיר',
        'שם': 'רחל לוי',
        'טלפון': '054-1112233',
        'תמונה 1': 'https://example.com/image1.jpg',
        'תמונה 2': '',
        'תמונה 3': '',
      }];
    }
    
    // COMMERCIAL REAL ESTATE
    if (slug.includes('commercial') || slug.includes('מסחרי')) {
      if (adType === 'WANTED') {
        return [{
          'תיווך': 'כן',
          'רחוב / אזור מבוקש': 'מרכז תל אביב',
          'סוג הנכס': 'משרד',
          'שטח במר': '100',
          'קומה': '2',
          'מצב הנכס': 'משופץ',
          'מחיר': '',
          'תאריך כניסה': '',
          'חניה': 'כן',
          'מעלית': 'כן',
          'מיזוג': 'כן',
          'שם': 'דוד כהן',
          'טלפון': '050-1234567',
        }];
      }
      return [{
        'תיווך': 'לא',
        'עיר': 'תל אביב',
        'רחוב': 'רוטשילד',
        'מספר בית': '12',
        'סוג הנכס': 'משרד',
        'שטח במר': '120',
        'קומה': '5',
        'מצב הנכס': 'משופץ',
        'תאריך כניסה': '01/06/2026',
        'מחיר': '15000',
        'חניה': 'כן',
        'מעלית': 'כן',
        'מיזוג': 'כן',
        'תיאור הנכס': 'משרד מרווח ומשופץ ברחוב רוטשילד',
        'שם': 'משה לוי',
        'טלפון': '052-9876543',
        'תמונה 1': 'https://example.com/office1.jpg',
        'תמונה 2': '',
        'תמונה 3': '',
      }];
    }
    
    // Fallback
    return [{
      'כותרת': 'דוגמה למודעה',
      'תיאור': 'תיאור מפורט...',
      'שם': 'שם מפרסם',
      'טלפון': '050-1234567',
    }];
  };

  const handlePreview = async () => {
    if (!file || !selectedCategoryId) {
      setError('נא לבחור קובץ וקטגוריה');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('categoryId', selectedCategoryId);
      formData.append('adType', showAdTypeSelector() ? (selectedAdType === 'WANTED' ? 'WANTED_FOR_SALE' : 'REGULAR') : 'REGULAR');

      const response = await api.post(
        '/admin/import/properties-file/preview',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setPreviewData(response.data as any);
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
      console.log('🔐 Token check:', localStorage.getItem('accessToken') ? 'Token exists' : 'NO TOKEN');
      console.log('📤 Sending commit request with data:', {
        categoryId: selectedCategoryId,
        adType: showAdTypeSelector() ? (selectedAdType === 'WANTED' ? 'WANTED_FOR_SALE' : 'REGULAR') : 'REGULAR',
        rowCount: validRows.length,
        firstRow: validRows[0],
        options: { initialStatus }
      });
      
      const response = await api.post(
        '/admin/import/properties-file/commit',
        {
          categoryId: selectedCategoryId,
          adType: showAdTypeSelector() ? (selectedAdType === 'WANTED' ? 'WANTED_FOR_SALE' : 'REGULAR') : 'REGULAR',
          data: validRows,
          options: {
            initialStatus,
          },
        }
      );

      const result = response.data as any;
      console.log('📥 Response from server:', result);
      console.log('✅ Created ads:', result.createdAds);
      if (result.createdAds && result.createdAds.length > 0) {
        console.log('🏙️ First ad details:', {
          id: result.createdAds[0].id,
          address: result.createdAds[0].address,
          cityId: result.createdAds[0].cityId,
          streetId: result.createdAds[0].streetId,
          neighborhood: result.createdAds[0].neighborhood
        });
      }
      setSuccess(
        `ייבוא הושלם בהצלחה! ${result.successRows} מודעות נוצרו בסטטוס ${initialStatus === 'PENDING' ? 'ממתין לאישור' : 'טיוטה'}.`
      );
      setPreviewData(null);
      setFile(null);
      setSelectedCategoryId('');
    } catch (err: any) {
      console.error('Commit error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.error || err.response?.data?.message || 'שגיאה בשמירת הנתונים');
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

  const getDisplayHeaders = () => {
    if (!previewData || previewData.preview.length === 0) return [];
    
    const firstRow = previewData.preview[0];
    return Object.keys(firstRow).filter(key => 
      key !== 'status' && key !== 'errors' && key !== 'rowNumber'
    ).slice(0, 6); // Show first 6 columns
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">ייבוא נכסים מקובץ</h1>
        <p className="text-black mt-2">
          ייבוא מודעות נכסים מקובץ XLSX לפי קטגוריה. כל מודעה תיווצר בסטטוס שתבחר (ממתין לאישור/טיוטה).
        </p>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 border-r-4 border-blue-400 p-4 mb-6">
        <div className="flex items-start gap-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800">שימו לב:</p>
            <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
              <li>בחר קטגוריה תחילה, ולאחר מכן בחר סוג מודעה (רגיל/דרושים)</li>
              <li>הורד את התבנית המתאימה - העמודות משתנות לפי הבחירה</li>
              <li>הקובץ חייב להיות בפורמט XLSX בלבד</li>
              <li>שדות חובה משתנים בהתאם לסוג המודעה - ראה תבנית לדוגמה</li>
              <li>שדות בוליאניים (כן/לא): ניתן להשתמש ב"כן"/"לא" או "yes"/"no"</li>
              <li>תמונות: 3 תמונות מקסימום (חוץ מדירות שבת) - הכנס URL מלא</li>
              <li>כל המודעות ייווצרו בסטטוס ממתין לאישור (לא מפורסמות אוטומטית)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Step 1: Category Selection */}
      {!previewData && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-black mb-4">שלב 1: בחירת קטגוריה</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">
              בחר קטגוריית נכס *
            </label>
            <select
              value={selectedCategoryId}
              onChange={handleCategoryChange}
              disabled={categoriesLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F3F3A] focus:border-transparent"
            >
              <option value="">בחר קטגוריה...</option>
              {categories?.filter((cat: any) => cat.isActive).map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameHe}
                </option>
              ))}
            </select>
          </div>

          {selectedCategoryId && showAdTypeSelector() && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                סוג מודעה *
              </label>
              <select
                value={selectedAdType}
                onChange={handleAdTypeChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F3F3A] focus:border-transparent"
              >
                <option value="REGULAR">מודעה רגילה (מוכר/משכיר)</option>
                <option value="WANTED">דרושים (קונה/שוכר)</option>
              </select>
              <p className="text-sm text-gray-600 mt-1">
                {selectedAdType === 'REGULAR' 
                  ? 'למי שיש נכס ורוצה למכור/להשכיר'
                  : 'למי שמחפש נכס לקנות/לשכור'}
              </p>
            </div>
          )}

          {selectedCategoryId && (
            <>
              <div className="mb-6">
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  הורד תבנית XLSX לקטגוריה זו
                </button>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  התבנית כוללת את כל העמודות הנדרשות והדוגמאות
                </p>
              </div>

              <h2 className="text-lg font-semibold text-black mb-4">שלב 2: העלאת קובץ</h2>
              
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
            </>
          )}
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
                  {getDisplayHeaders().map(header => (
                    <th key={header} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {header}
                    </th>
                  ))}
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
                    {getDisplayHeaders().map(header => (
                      <td key={header} className="px-4 py-3 text-sm text-black max-w-xs truncate">
                        {row[header]?.toString() || '-'}
                      </td>
                    ))}
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
