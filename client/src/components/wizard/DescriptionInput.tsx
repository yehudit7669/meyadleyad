import React, { useState, useEffect } from 'react';

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength?: number;
  maxWords?: number;
}

const DescriptionInput: React.FC<DescriptionInputProps> = ({
  value,
  onChange,
  error,
  maxLength = 1200,
  maxWords = 16,
}) => {
  const [localError, setLocalError] = useState<string>('');
  const charCount = value.length;
  const wordCount = value.trim().length > 0 ? value.trim().split(/\s+/).length : 0;

  useEffect(() => {
    // Clear local error when external error changes
    if (error) {
      setLocalError('');
    }
  }, [error]);

  const validateContent = (text: string): string | null => {
    // Check for URLs
    const urlPattern = /(https?:\/\/|www\.)/i;
    if (urlPattern.test(text)) {
      return 'אסור להכניס קישורים (http, https, www)';
    }

    // Check for phone numbers
    const phonePattern = /(\d[\s.-]?){9,10}|05\d[-\s]?\d{7}/;
    if (phonePattern.test(text)) {
      return 'אסור להכניס מספרי טלפון';
    }

    // Check for promotional text
    const promoWords = /מבצע|הזדמנות|הצעה מיוחדת|במחיר מיוחד|לזמן מוגבל/i;
    if (promoWords.test(text)) {
      return 'אסור להכניס טקסט פרסומי';
    }

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Prevent exceeding max length
    if (newValue.length > maxLength) {
      return;
    }

    // Check word count
    const newWordCount = newValue.trim().length > 0 ? newValue.trim().split(/\s+/).length : 0;
    if (newWordCount > maxWords) {
      setLocalError(`התיאור חייב להיות עד ${maxWords} מילים`);
    } else {
      // Validate content
      const contentError = validateContent(newValue);
      if (contentError) {
        setLocalError(contentError);
      } else {
        setLocalError('');
      }
    }

    onChange(newValue);
  };

  const displayError = error || localError;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        תיאור הנכס (אופציונלי)
      </label>
      
      <textarea
        value={value}
        onChange={handleChange}
        rows={8}
        placeholder="מה חשוב לדעת על הנכס?&#10;תאר את המצב, היתרונות, סביבת המגורים, הבניין והקהילה."
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent resize-none ${
          displayError
            ? 'border-red-500 focus:ring-red-500'
            : charCount > 0
            ? 'border-green-500'
            : 'border-gray-300'
        }`}
        dir="rtl"
      />

      {/* Word counter and validation messages */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex flex-col gap-1">
          {wordCount > 0 && !displayError && wordCount <= maxWords && (
            <span className="text-green-600">✓ {wordCount} מילים (מתוך {maxWords})</span>
          )}
          {displayError && (
            <span className="text-red-600">⚠ {displayError}</span>
          )}
        </div>
        
        <span
          className={`font-medium ${
            wordCount > maxWords
              ? 'text-red-600'
              : wordCount >= maxWords * 0.8
              ? 'text-amber-600'
              : 'text-gray-500'
          }`}
        >
          {wordCount} / {maxWords} מילים
        </span>
      </div>

      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 text-lg">💡</span>
          <div className="text-blue-800">
            <div className="font-medium mb-1">המלצות לתיאור:</div>
            <ul className="space-y-1 text-blue-700 mr-4">
              <li>• צלם באור טבעי, צלם גם את הסלון, המטבח, חדר רחצה ומבט חיצוני</li>
              <li>• תאר את מצב הנכס, חידושים שבוצעו, ציוד קבוע</li>
              <li>• הזכר יתרונות בסביבה: גנים, בתי ספר, תחבורה ציבורית</li>
              <li>• ציין את אופי הקהילה והשכנים</li>
              <li className="text-red-600 font-medium">✗ אין לכלול קישורים, מספרי טלפון או טקסט פרסומי</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DescriptionInput;
