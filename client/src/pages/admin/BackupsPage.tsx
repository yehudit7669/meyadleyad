import { useState } from 'react';
import { Download, Upload, HardDrive, AlertTriangle, Shield, Lock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../services/api';

interface BackupStatus {
  inProgress: boolean;
  type: 'create' | 'restore' | null;
  progress: number;
  message: string;
}

export default function BackupsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [createPassword, setCreatePassword] = useState('');
  const [createPasswordConfirm, setCreatePasswordConfirm] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [status, setStatus] = useState<BackupStatus>({
    inProgress: false,
    type: null,
    progress: 0,
    message: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const validatePassword = (password: string): boolean => {
    return password.length >= 12;
  };

  const handleCreateBackup = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!createPassword || !createPasswordConfirm) {
      setError('נא להזין סיסמה ואימות סיסמה');
      return;
    }

    if (createPassword !== createPasswordConfirm) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (!validatePassword(createPassword)) {
      setError('הסיסמה חייבת להכיל לפחות 12 תווים');
      return;
    }

    try {
      setStatus({
        inProgress: true,
        type: 'create',
        progress: 0,
        message: 'מתחיל יצירת גיבוי...'
      });

      const response = await api.post(
        '/admin/backups/create',
        { password: createPassword },
        {
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setStatus(prev => ({ ...prev, progress, message: 'מוריד קובץ גיבוי מוצפן...' }));
          }
        }
      );

      // Generate filename
      const siteName = 'meyadleyad';
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `${siteName}_backup_${dateStr}_${timeStr}.zip`;

      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(`הגיבוי נוצר בהצלחה והורד כקובץ: ${filename}`);
      setShowCreateModal(false);
      setCreatePassword('');
      setCreatePasswordConfirm('');
    } catch (err: any) {
      console.error('Backup creation failed:', err);
      setError(err.response?.data?.message || 'שגיאה ביצירת הגיבוי');
    } finally {
      setStatus({
        inProgress: false,
        type: null,
        progress: 0,
        message: ''
      });
    }
  };

  const handleRestoreBackup = async () => {
    setError('');
    setSuccess('');

    if (!restoreFile) {
      setError('נא לבחור קובץ גיבוי');
      return;
    }

    if (!restorePassword) {
      setError('נא להזין את סיסמת ההצפנה');
      return;
    }

    try {
      setStatus({
        inProgress: true,
        type: 'restore',
        progress: 0,
        message: 'מתחיל שחזור מערכת...'
      });

      const formData = new FormData();
      formData.append('backupFile', restoreFile);
      formData.append('password', restorePassword);

      await api.post('/admin/backups/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setStatus(prev => ({ ...prev, progress, message: 'מעלה ומפענח גיבוי...' }));
        }
      });

      setSuccess('המערכת שוחזרה בהצלחה! העמוד ייטען מחדש בעוד 3 שניות...');
      setShowRestoreModal(false);
      setRestorePassword('');
      setRestoreFile(null);

      // Reload page after restore
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err: any) {
      console.error('Restore failed:', err);
      setError(err.response?.data?.message || 'שגיאה בשחזור המערכת');
    } finally {
      setStatus({
        inProgress: false,
        type: null,
        progress: 0,
        message: ''
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <HardDrive className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">גיבויים ושחזור מערכת</h1>
            <p className="text-gray-600">ניהול גיבויים מוצפנים ושחזור מערכת מלא</p>
          </div>
        </div>

        {/* Security Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-red-900 mb-1">⚠️ אזהרת אבטחה קריטית</p>
            <ul className="text-red-800 space-y-1">
              <li>• המערכת אינה שומרת את סיסמת ההצפנה בשום מקום</li>
              <li>• אובדן הסיסמה = אובדן הגיבוי לצמיתות</li>
              <li>• שחזור מערכת מחליף את כל הנתונים הקיימים</li>
              <li>• מותר רק למנהלי על (Super Admin)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Progress */}
      {status.inProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="animate-spin">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-blue-900 font-medium">{status.message}</p>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <p className="text-sm text-blue-700 mt-1">{status.progress}%</p>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Backup */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">יצירת גיבוי מלא</h2>
          </div>

          <p className="text-gray-600 mb-4">
            יצירת גיבוי מוצפן הכולל:
          </p>

          <ul className="space-y-2 mb-6 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>מסד נתונים מלא (Schema + Data)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>קוד המערכת (backend + frontend)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>קבצי משתמשים (uploads/media)</span>
            </li>
            <li className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>הצפנה AES-256 ללא קבצים ביניים</span>
            </li>
          </ul>

          <button
            onClick={() => setShowCreateModal(true)}
            disabled={status.inProgress}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            🛡️ יצירת גיבוי מלא
          </button>
        </div>

        {/* Restore Backup */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Upload className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">שחזור מערכת</h2>
          </div>

          <p className="text-gray-600 mb-4">
            שחזור מלא מקובץ גיבוי מוצפן
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ פעולה זו תחליף את כל הנתונים הקיימים במערכת
            </p>
          </div>

          <ul className="space-y-2 mb-6 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span>שחזור DB מלא</span>
            </li>
            <li className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span>שחזור קוד המערכת</span>
            </li>
            <li className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span>שחזור קבצי משתמשים</span>
            </li>
          </ul>

          <button
            onClick={() => setShowRestoreModal(true)}
            disabled={status.inProgress}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            ⬆️ שחזור מגיבוי
          </button>
        </div>
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">הגדרת סיסמת הצפנה</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סיסמת הצפנה (מינימום 12 תווים)
                </label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="הזן סיסמה חזקה"
                  disabled={status.inProgress}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  אימות סיסמה
                </label>
                <input
                  type="password"
                  value={createPasswordConfirm}
                  onChange={(e) => setCreatePasswordConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="הזן שוב את הסיסמה"
                  disabled={status.inProgress}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ שמור את הסיסמה במקום בטוח! המערכת לא שומרת אותה ולא תוכל לשחזר אותה.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateBackup}
                disabled={status.inProgress}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {status.inProgress ? 'יוצר גיבוי...' : 'צור גיבוי'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreatePassword('');
                  setCreatePasswordConfirm('');
                  setError('');
                }}
                disabled={status.inProgress}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Backup Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">שחזור מערכת מגיבוי</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  קובץ גיבוי מוצפן (.zip)
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={status.inProgress}
                />
                {restoreFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    קובץ נבחר: {restoreFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סיסמת הצפנה
                </label>
                <input
                  type="password"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="הזן את סיסמת ההצפנה המקורית"
                  disabled={status.inProgress}
                />
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ פעולה זו תמחק את כל הנתונים הקיימים ותשחזר את המערכת מהגיבוי!
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestoreBackup}
                disabled={status.inProgress}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {status.inProgress ? 'משחזר...' : 'שחזר מערכת'}
              </button>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestorePassword('');
                  setRestoreFile(null);
                  setError('');
                }}
                disabled={status.inProgress}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
