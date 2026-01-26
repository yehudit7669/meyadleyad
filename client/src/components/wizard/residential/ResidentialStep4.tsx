import React, { useState } from 'react';
import { WizardStepProps } from '../../../types/wizard';
import DescriptionInput from '../DescriptionInput';
import PropertyImagesUpload from '../PropertyImagesUpload';
import FloorPlanUpload from '../FloorPlanUpload';

interface PropertyImage {
  url: string;
  file?: File;
  isPrimary: boolean;
  order: number;
}

interface ResidentialStep4Data {
  description: string;
  images: PropertyImage[];
  floorPlan?: File | null;
}

const ResidentialStep4: React.FC<WizardStepProps> = ({ data, onNext, onPrev }) => {
  const [formData, setFormData] = useState<ResidentialStep4Data>(
    data || {
      description: '',
      images: [],
      floorPlan: null,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDescriptionChange = (description: string) => {
    setFormData((prev) => ({
      ...prev,
      description,
    }));
    // Clear error when user types
    if (errors.description) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.description;
        return newErrors;
      });
    }
  };

  const handleImagesChange = (images: PropertyImage[]) => {
    setFormData((prev) => ({
      ...prev,
      images,
    }));
    // Clear error when user adds images
    if (errors.images) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };

  const handleFloorPlanChange = (file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      floorPlan: file,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate description only if provided
    if (formData.description && formData.description.length > 0) {
      if (formData.description.length > 1200) {
        newErrors.description = 'התיאור חייב להיות עד 1200 תווים';
      }

      // Validate description content
      const urlPattern = /(https?:\/\/|www\.)/i;
      if (urlPattern.test(formData.description)) {
        newErrors.description = 'אסור להכניס קישורים (http, https, www)';
      }

      const phonePattern = /(\d[\s.-]?){9,10}|05\d[-\s]?\d{7}/;
      if (phonePattern.test(formData.description)) {
        newErrors.description = 'אסור להכניס מספרי טלפון';
      }

      const promoWords = /מבצע|הזדמנות|הצעה מיוחדת|במחיר מיוחד|לזמן מוגבל/i;
      if (promoWords.test(formData.description)) {
        newErrors.description = 'אסור להכניס טקסט פרסומי';
      }
    }

    // Images are optional - no minimum required
    if (formData.images.length > 15) {
      newErrors.images = 'מקסימום 15 תמונות';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext(formData);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">העלאת תמונה וטקסט</h2>
        <p className="text-gray-600">תאר את הנכס והעלה תמונות ותכנית</p>
      </div>

      <div className="space-y-8">
        {/* Description Input */}
        <DescriptionInput
          value={formData.description}
          onChange={handleDescriptionChange}
          error={errors.description}
          minLength={80}
          maxLength={1200}
        />

        {/* Property Images */}
        <div>
          <PropertyImagesUpload
            images={formData.images}
            onChange={handleImagesChange}
            minImages={0}
            maxImages={15}
            maxFileSize={5}
          />
          {errors.images && (
            <p className="mt-2 text-sm text-red-600">⚠ {errors.images}</p>
          )}
        </div>

        {/* Floor Plan */}
        <FloorPlanUpload
          file={formData.floorPlan || null}
          onChange={handleFloorPlanChange}
          maxFileSize={10}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onPrev}
          className="px-6 py-3 bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] rounded-lg font-medium hover:bg-[#1F3F3A] hover:text-white transition-all"
        >
          ← הקודם
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-8 py-3 bg-[#C9A24D] text-[#1F3F3A] rounded-lg font-bold hover:bg-[#B08C3C] transition-all shadow-lg hover:shadow-xl"
        >
          הבא →
        </button>
      </div>
    </div>
  );
};

export default ResidentialStep4;
