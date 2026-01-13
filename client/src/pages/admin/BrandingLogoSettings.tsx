import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface BrandingConfig {
  id: string;
  logoUrl: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity: number;
  sizePct: number;
}

const POSITION_OPTIONS = [
  { value: 'top-left', label: 'ימין עליון', labelHe: 'ימין עליון' },
  { value: 'top-right', label: 'שמאל עליון', labelHe: 'שמאל עליון' },
  { value: 'bottom-left', label: 'ימין תחתון', labelHe: 'ימין תחתון' },
  { value: 'bottom-right', label: 'שמאל תחתון', labelHe: 'שמאל תחתון' },
];

const BrandingLogoSettings: React.FC = () => {
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sampleImageFile, setSampleImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sampleImageInputRef = useRef<HTMLInputElement>(null);

  // טעינת הגדרות נוכחיות
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/admin/branding', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setConfig((response.data as { data: BrandingConfig }).data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בטעינת ההגדרות');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ולידציה
    if (file.type !== 'image/png') {
      setError('הלוגו חייב להיות בפורמט PNG');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > 1024 * 1024) {
      setError('גודל הלוגו לא יכול לעלות על 1MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('logo', file);

      const response = await axios.post('/api/admin/branding/logo', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setConfig((response.data as { data: BrandingConfig }).data);
      setSuccess('הלוגו הועלה בהצלחה');
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בהעלאת הלוגו');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await axios.patch(
        '/api/admin/branding',
        {
          position: config.position,
          opacity: config.opacity,
          sizePct: config.sizePct,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      setConfig((response.data as { data: BrandingConfig }).data);
      setSuccess('ההגדרות נשמרו בהצלחה');
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('האם אתה בטוח שברצונך לאפס להגדרות ברירת מחדל?')) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await axios.post(
        '/api/admin/branding/reset',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      setConfig((response.data as { data: BrandingConfig }).data);
      setSuccess('ההגדרות אופסו לברירת מחדל');
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה באיפוס ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!config) return;

    // בדוק אם יש תמונת דוגמה
    if (!sampleImageFile) {
      setError('יש להעלות תמונת דוגמה לתצוגה מקדימה');
      return;
    }

    try {
      setLoadingPreview(true);
      setError('');

      // המר את הקובץ ל-base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Image = e.target?.result as string;

          const response = await axios.post(
            '/api/admin/branding/preview',
            {
              position: config.position,
              opacity: config.opacity,
              sizePct: config.sizePct,
              sampleImageData: base64Image,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
              },
            }
          );

          setPreviewUrl((response.data as { data: { preview: string } }).data.preview);
        } catch (err: any) {
          setError(err.response?.data?.message || 'שגיאה ביצירת תצוגה מקדימה');
        } finally {
          setLoadingPreview(false);
        }
      };

      reader.onerror = () => {
        setError('שגיאה בקריאת הקובץ');
        setLoadingPreview(false);
      };

      reader.readAsDataURL(sampleImageFile);
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה ביצירת תצוגה מקדימה');
      setLoadingPreview(false);
    }
  };

  const handleSampleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ולידציה
    if (!file.type.startsWith('image/')) {
      setError('יש להעלות קובץ תמונה');
      if (sampleImageInputRef.current) {
        sampleImageInputRef.current.value = '';
      }
      return;
    }

    setSampleImageFile(file);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center text-black py-8">
        שגיאה בטעינת ההגדרות
      </div>
    );
  }

  return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-black">לוגו למיתוג תמונות</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-black px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-black px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* לוגו נוכחי */}
          <div>
            <h2 className="text-xl font-semibold mb-3 text-black">לוגו נוכחי</h2>
            {config.logoUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={config.logoUrl}
                  alt="לוגו נוכחי"
                  className="w-32 h-32 object-contain border border-gray-200 rounded p-2 bg-gray-50"
                />
                <div className="text-sm text-black">
                  <p>הלוגו מוצג בתמונות חדשות בלבד</p>
                  <p className="mt-1">תמונות קיימות לא ישתנו</p>
                </div>
              </div>
            ) : (
              <div className="text-black italic">לא הועלה לוגו</div>
            )
            }
          </div>

          {/* העלאת לוגו חדש */}
          <div>
            <h2 className="text-xl font-semibold mb-3 text-black">העלאת לוגו חדש</h2>
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'מעלה...' : 'בחר קובץ PNG'}
              </button>
              <p className="text-sm text-black">
                • PNG בלבד • עד 1MB • רקע שקוף מומלץ
              </p>
            </div>
          </div>

          {/* מיקום */}
          <div>
            <h2 className="text-xl font-semibold mb-3 text-black">מיקום הלוגו</h2>
            <div className="grid grid-cols-2 gap-3">
              {POSITION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 p-3 border-2 rounded cursor-pointer transition-colors ${
                    config.position === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="position"
                    value={option.value}
                    checked={config.position === option.value}
                    onChange={(e) =>
                      setConfig({ ...config, position: e.target.value as any })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-black">{option.labelHe}</span>
                </label>
              ))}
            </div>
          </div>

          {/* שקיפות */}
          <div>
            <h2 className="text-xl font-semibold mb-3 text-black">
              שקיפות: {config.opacity}%
            </h2>
            <input
              type="range"
              min="0"
              max="100"
              value={config.opacity}
              onChange={(e) =>
                setConfig({ ...config, opacity: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-sm text-black mt-1">מומלץ: 60-80%</p>
          </div>

          {/* גודל יחסי */}
          <div>
            <h2 className="text-xl font-semibold mb-3 text-black">
              גודל יחסי: {config.sizePct}%
            </h2>
            <input
              type="range"
              min="5"
              max="30"
              value={config.sizePct}
              onChange={(e) =>
                setConfig({ ...config, sizePct: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-sm text-black mt-1">
              אחוז מרוחב התמונה (5-30%)
            </p>
          </div>

          {/* תצוגה מקדימה */}
          <div>
            <h2 className="text-xl font-semibold mb-3 text-black">תצוגה מקדימה</h2>
            
            {/* העלאת תמונת דוגמה */}
            <div className="mb-4">
              <input
                type="file"
                ref={sampleImageInputRef}
                accept="image/*"
                onChange={handleSampleImageUpload}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => sampleImageInputRef.current?.click()}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  בחר תמונת דוגמה
                </button>
                {sampleImageFile && (
                  <span className="text-sm text-black">
                    {sampleImageFile.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handleGeneratePreview}
                disabled={loadingPreview || !config.logoUrl || !sampleImageFile}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                {loadingPreview ? 'יוצר...' : 'הצג תצוגה מקדימה'}
              </button>
            </div>

            {previewUrl && (
              <div className="border border-gray-300 rounded p-2 bg-gray-50">
                <img
                  src={previewUrl}
                  alt="תצוגה מקדימה"
                  className="w-full max-w-2xl mx-auto"
                />
              </div>
            )}
          </div>

          {/* כפתורי פעולה */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
            >
              {saving ? 'שומר...' : 'שמור והחל'}
            </button>
            <button
              onClick={handleReset}
              disabled={saving}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 disabled:bg-gray-400"
            >
              אפס לברירת מחדל
            </button>
          </div>

          {/* הערה חשובה */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-sm text-black">
              <strong>שים לב:</strong> שינויים אלו ישפיעו רק על תמונות שיועלו מכאן ואילך.
              תמונות קיימות לא ישתנו.
            </p>
          </div>
        </div>
      </div>
  );
};

export default BrandingLogoSettings;
