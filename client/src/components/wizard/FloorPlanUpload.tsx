import React, { useState, useRef } from 'react';

interface FloorPlanUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
  maxFileSize?: number; // in MB
}

const FloorPlanUpload: React.FC<FloorPlanUploadProps> = ({
  file,
  onChange,
  maxFileSize = 10, // 10MB default
}) => {
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    setError('');

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('פורמט לא נתמך. יש להעלות PDF, JPG, JPEG או PNG');
      return;
    }

    // Validate file size
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      setError(`הקובץ גדול מדי (${fileSizeMB.toFixed(2)}MB). מקסימום ${maxFileSize}MB`);
      return;
    }

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }

    onChange(selectedFile);
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const isPDF = file?.type === 'application/pdf';
  const isImage = file?.type.startsWith('image/');

  return (
    <div className="space-y-4" dir="rtl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          תכנית דירה / שרטוט (אופציונלי)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          העלה שרטוט או תכנית של הנכס כדי לעזור לקונים לדמיין את החלוקה
        </p>
      </div>

      {!file ? (
        // Upload Area
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#C9A24D] hover:bg-[#C9A24D] hover:bg-opacity-5 transition-all cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
          />
          <svg
            className="mx-auto h-10 w-10 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm font-medium text-gray-700 mb-1">
            גרור תכנית לכאן או לחץ לבחירה
          </p>
          <p className="text-xs text-gray-500">
            PDF, JPG, JPEG, PNG עד {maxFileSize}MB
          </p>
        </div>
      ) : (
        // File Preview
        <div className="relative bg-white p-4 rounded-lg border-2 border-[#C9A24D]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Icon/Preview */}
              {isPDF && (
                <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    <path
                      fill="#fff"
                      d="M8 10h4v1H8v-1zm0 2h4v1H8v-1zm0-4h2v1H8V8z"
                    />
                  </svg>
                </div>
              )}
              {isImage && preview && (
                <img
                  src={preview}
                  alt="תצוגה מקדימה"
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {file.name}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                  {isPDF && ' • PDF'}
                  {isImage && ' • תמונה'}
                </div>
                {isPDF && (
                  <a
                    href={URL.createObjectURL(file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#C9A24D] hover:underline mt-1 inline-block"
                  >
                    פתח לצפייה →
                  </a>
                )}
              </div>
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              title="הסר קובץ"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Success Badge */}
          <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>הקובץ הועלה בהצלחה</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          ⚠ {error}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-gray-600">ℹ️</span>
          <div className="text-gray-700">
            <div className="font-medium mb-1">טיפים להעלאת תכנית:</div>
            <ul className="space-y-1 text-gray-600 mr-4">
              <li>• וודא שהשרטוט ברור וקריא</li>
              <li>• ניתן לצלם תכנית פיזית או לסרוק אותה</li>
              <li>• אם יש לך PDF מהאדריכל - מצוין!</li>
              <li>• שדה זה אינו חובה אך מומלץ מאוד</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanUpload;
