import React, { useState, useRef } from 'react';

interface PropertyImage {
  url: string;
  file?: File;
  isPrimary: boolean;
  order: number;
}

interface PropertyImagesUploadProps {
  images: PropertyImage[];
  onChange: (images: PropertyImage[]) => void;
  minImages?: number;
  maxImages?: number;
  maxFileSize?: number; // in MB
}

const PropertyImagesUpload: React.FC<PropertyImagesUploadProps> = ({
  images,
  onChange,

  maxImages = 15,
  maxFileSize = 5, // 5MB default
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔒 Validate file type using magic bytes
  const validateFileType = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const arr = new Uint8Array(reader.result as ArrayBuffer).subarray(0, 4);
        let header = '';
        for (let i = 0; i < arr.length; i++) {
          header += arr[i].toString(16).padStart(2, '0');
        }
        
        // Check magic bytes
        const isJPEG = header.startsWith('ffd8ff'); // JPEG
        const isPNG = header.startsWith('89504e47'); // PNG
        
        resolve(isJPEG || isPNG);
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    setError('');
    const filesArray = Array.from(files);
    const validFiles: PropertyImage[] = [];
    const errors: string[] = [];

    // Check total count
    if (images.length + filesArray.length > maxImages) {
      setError(`ניתן להעלות עד ${maxImages} תמונות. כרגע יש ${images.length} תמונות.`);
      return;
    }

    for (const file of filesArray) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: פורמט לא נתמך (רק JPG, JPEG, PNG)`);
        continue;
      }

      // 🔒 SECURITY: Validate real file type using magic bytes
      const isValidImage = await validateFileType(file);
      if (!isValidImage) {
        errors.push(`${file.name}: ⚠️ הקובץ אינו תמונה אמיתית! (זוהה כקובץ מזויף)`);
        continue;
      }

      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxFileSize) {
        errors.push(`${file.name}: גודל מעל ${maxFileSize}MB (${fileSizeMB.toFixed(2)}MB)`);
        continue;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      validFiles.push({
        url,
        file,
        isPrimary: images.length === 0 && validFiles.length === 0, // First image is primary
        order: images.length + validFiles.length,
      });
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onChange([...images, ...validFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemove = (index: number) => {
    const removedImage = images[index];
    const newImages = images.filter((_, i) => i !== index);

    // If removed image was primary and there are other images, make the first one primary
    if (removedImage.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }

    // Update order
    newImages.forEach((img, idx) => {
      img.order = idx;
    });

    onChange(newImages);
  };

  const handleSetPrimary = (index: number) => {
    const newImages = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    onChange(newImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    // Update order
    newImages.forEach((img, idx) => {
      img.order = idx;
    });

    // If dragged to first position, make it primary
    if (index === 0) {
      newImages.forEach((img, idx) => {
        img.isPrimary = idx === 0;
      });
    }

    setDraggedIndex(index);
    onChange(newImages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handlePreview = (url: string) => {
    setPreviewImage(url);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  // const isMinimumMet = images.length >= minImages;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#C9A24D] hover:bg-[#C9A24D] hover:bg-opacity-5 transition-all cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-lg font-medium text-gray-700 mb-2">
          גרור תמונות לכאן או לחץ לבחירה
        </p>
        <p className="text-sm text-gray-500">
          JPG, JPEG, PNG עד {maxFileSize}MB | עד {maxImages} תמונות (אופציונלי)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 whitespace-pre-line">
          {error}
        </div>
      )}

      {/* Validation Status */}
      <div className="flex items-center gap-2 text-sm">
        {images.length === 0 && (
          <span className="text-blue-600">ℹ️ תמונות אופציונליות - מומלץ להעלות כמה שיותר</span>
        )}
        {images.length > 0 && (
          <span className="text-green-600">✓ {images.length} תמונות הועלו ({images.length}/{maxImages})</span>
        )}
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-move ${
                image.isPrimary
                  ? 'border-[#C9A24D] ring-2 ring-[#C9A24D] ring-opacity-30'
                  : 'border-gray-200 hover:border-[#C9A24D]'
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              {/* Image */}
              <img
                src={image.url}
                alt={`תמונה ${index + 1}`}
                className="w-full h-32 object-cover"
              />

              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-[#C9A24D] text-[#1F3F3A] px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                  <span>⭐</span>
                  <span>תמונה ראשית</span>
                </div>
              )}

              {/* Order Badge */}
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {/* Preview */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(image.url);
                  }}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="תצוגה מקדימה"
                >
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>

                {/* Set Primary */}
                {!image.isPrimary && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(index);
                    }}
                    className="p-2 bg-white rounded-full hover:bg-yellow-50 transition-colors"
                    title="סמן כתמונה ראשית"
                  >
                    <svg
                      className="w-5 h-5 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                )}

                {/* Delete */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                  title="מחק תמונה"
                >
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 text-lg">💡</span>
          <div className="text-blue-800">
            <div className="font-medium mb-1">המלצות לתמונות:</div>
            <ul className="space-y-1 text-blue-700 mr-4">
              <li>• צלם באור טבעי - בוקר או אחר הצהריים מוקדם</li>
              <li>• צלם את הסלון, המטבח, חדר רחצה ומבט חיצוני</li>
              <li>• גרור תמונות כדי לשנות סדר</li>
              <li>• התמונה הראשונה תוצג בתוצאות החיפוש</li>
              <li>• לחץ על כוכב כדי לסמן תמונה ראשית</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closePreview}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-3xl"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="תצוגה מקדימה"
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyImagesUpload;
