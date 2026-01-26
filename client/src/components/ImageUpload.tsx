import { useState, useEffect } from 'react';

interface ImageUploadProps {
  images: { id?: string; url: string; file?: File }[];
  onChange: (images: { id?: string; url: string; file?: File }[]) => void;
  onDeleteExisting?: (imageId: string) => Promise<void>;
  maxImages?: number;
}

export default function ImageUpload({
  images,
  onChange,
  onDeleteExisting,
  maxImages = 5,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  // עדכון previews כאשר images משתנה (כולל תמונות קיימות מהשרת)
  useEffect(() => {
    const newPreviews = images.map((img) => {
      // אם זה תמונה קיימת מהשרת (URL מלא)
      if (img.url.startsWith('http') || img.url.startsWith('/uploads')) {
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        return img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`;
      }
      // אם זה data URL (תמונה חדשה)
      return img.url;
    });
    setPreviews(newPreviews);
  }, [images]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Maximum 10MB per image
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    if (previews.length + files.length > maxImages) {
      alert(`ניתן להעלות עד ${maxImages} תמונות`);
      return;
    }

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      alert(`חלק מהתמונות גדולות מדי (מקסימום 10MB לתמונה).\nאנא צמצם את התמונות או בחר תמונות קטנות יותר.`);
      return;
    }

    // Process all files at once
    const newImages: { url: string; file: File }[] = [];
    const newPreviews: string[] = [];
    let processedCount = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result as string;
        newPreviews.push(previewUrl);
        newImages.push({ url: previewUrl, file });
        
        processedCount++;
        if (processedCount === files.length) {
          // All files processed
          setPreviews((prev) => [...prev, ...newPreviews]);
          onChange([...images, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = async (index: number) => {
    const imageToRemove = images[index];
    
    // אם זו תמונה קיימת מהשרת (יש לה id)
    if (imageToRemove.id && onDeleteExisting) {
      try {
        await onDeleteExisting(imageToRemove.id);
      } catch (error) {
        console.error('Failed to delete image:', error);
        alert('שגיאה במחיקת התמונה. אנא נסה שוב.');
        return;
      }
    }
    
    const newPreviews = previews.filter((_, i) => i !== index);
    const newImages = images.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    onChange(newImages);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Grid תמונות */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {previews.map((preview, index) => (
          <div key={index} className="relative group">
            <img
              src={preview}
              alt={`תמונה ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label={`הסר תמונה ${index + 1}`}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              ×
            </button>
          </div>
        ))}

        {/* כפתור העלאה */}
        {previews.length < maxImages && (
          <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="text-4xl text-gray-400 mb-2">+</span>
            <span className="text-sm text-gray-600">העלה תמונה</span>
          </label>
        )}
      </div>

      {/* הנחיות */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-blue-600">ℹ️</span>
          <div className="text-blue-800">
            <div className="font-medium mb-1">טיפים להעלאת תמונות:</div>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>תמונות אופציונליות</strong></li>
              <li>• העלה עד {maxImages} תמונות</li>
              <li>• גודל מקסימלי לתמונה: 10MB</li>
              <li>• השתמש בתמונות באיכות גבוהה</li>
              <li>• צלם מזוויות שונות</li>
              <li>• התמונה הראשונה תופיע כתמונה ראשית</li>
            </ul>
          </div>
        </div>
      </div>

      {/* מונה תמונות */}
      <div className={`text-center text-sm font-medium ${
        previews.length >= maxImages 
          ? 'text-green-600' 
          : 'text-blue-600'
      }`}>
        {previews.length} מתוך {maxImages} תמונות
      </div>
    </div>
  );
}
