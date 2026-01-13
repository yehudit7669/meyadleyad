import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adsService } from '../../../services/ads.service';
import { categoriesService } from '../../../services/categories.service';
import WizardProgress from '../WizardProgress';
import HolidayRentStep1 from './HolidayRentStep1';
import HolidayRentStep2 from './HolidayRentStep2';
import HolidayRentStep3 from './HolidayRentStep3';
import HolidayRentStep4 from './HolidayRentStep4';
import {
  AdType,
  HolidayRentWizardData,
  HolidayRentStep1Data,
  HolidayRentStep2Data,
  HolidayRentStep3Data,
  HolidayRentStep4Data,
} from '../../../types/wizard';

const HolidayWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<HolidayRentWizardData>>({
    adType: AdType.HOLIDAY_RENT,
  });

  // Load categories for mapping
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getCategories(),
  });

  const createAdMutation = useMutation({
    mutationFn: (adData: any) => adsService.createAd(adData),
    onSuccess: (data: any) => {
      const adNumber = data.adNumber || data.id;
      navigate(`/ads/${data.id}`, {
        state: { message: `מודעה מס' ${adNumber} הועלתה בהצלחה!` },
      });
    },
    onError: (error: any) => {
      console.error('Error creating ad:', error);
      alert(error.response?.data?.message || 'שגיאה בפרסום המודעה. אנא נסה שוב.');
    },
  });

  const handleStep1Next = (data: HolidayRentStep1Data) => {
    setWizardData((prev) => ({ ...prev, step1: data }));
    setCurrentStep(2);
  };

  const handleStep2Next = (data: HolidayRentStep2Data) => {
    setWizardData((prev) => ({ ...prev, step2: data }));
    setCurrentStep(3);
  };

  const handleStep3Next = (data: HolidayRentStep3Data) => {
    setWizardData((prev) => ({ ...prev, step3: data }));
    setCurrentStep(4);
  };

  const handleStep4Next = (data: HolidayRentStep4Data) => {
    setWizardData((prev) => ({ ...prev, step4: data }));
    handleFinalSubmit({ ...wizardData, step4: data } as HolidayRentWizardData);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const prepareApiPayload = (data: HolidayRentWizardData) => {
    // Map HOLIDAY_RENT to category slug
    const categorySlug = 'shabbat-apartments';

    // Find categoryId
    const category = categories?.find((cat: any) => cat.slug === categorySlug);
    if (!category) {
      throw new Error('לא נמצא קטגוריה מתאימה');
    }

    // Build title from parasha and city
    const title = `דירה לשבת ${data.step3.parasha} - ${data.step1.cityName}`;

    // Build description
    const description = `
דירה ל${data.step2.isPaid ? 'אירוח בתשלום' : 'אירוח ללא תשלום'} בשבת ${data.step3.parasha}.
סוג נכס: ${data.step3.propertyType}
${data.step3.rooms} חדרים, קומה ${data.step3.floor}
${data.step3.purpose === 'HOSTING' ? 'אירוח מלא' : 'לינה בלבד'}
`.trim();

    // Build customFields with all the holiday rent specific data
    const customFields: any = {
      parasha: data.step3.parasha,
      propertyType: data.step3.propertyType,
      rooms: data.step3.rooms,
      purpose: data.step3.purpose,
      floor: data.step3.floor,
      balconiesCount: data.step3.balconiesCount,
      features: data.step3.features,
      isPaid: data.step2.isPaid,
    };

    if (data.step3.priceRequested) {
      customFields.priceRequested = data.step3.priceRequested;
    }

    console.log('🔍 HOLIDAY WIZARD - Features being sent:', data.step3.features);
    console.log('🔍 HOLIDAY WIZARD - Full customFields:', customFields);

    return {
      title,
      description,
      price: data.step2.isPaid && data.step3.priceRequested ? data.step3.priceRequested : undefined,
      categoryId: category.id,
      cityId: data.step1.cityId,
      streetId: data.step1.streetId,
      houseNumber: String(data.step1.houseNumber),
      customFields,
      contactName: data.step4.contactName || undefined,
      contactPhone: data.step4.contactPhone,
    };
  };

  const handleFinalSubmit = (data: HolidayRentWizardData) => {
    try {
      const payload = prepareApiPayload(data);
      createAdMutation.mutate(payload);
    } catch (error: any) {
      alert(error.message || 'שגיאה בהכנת הנתונים');
    }
  };

  const totalSteps = 4;
  const stepTitles = ['כתובת', 'תשלום', 'פרטים', 'התקשרות'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* Progress */}
          <WizardProgress 
            currentStep={currentStep} 
            totalSteps={totalSteps}
            stepTitles={stepTitles}
          />

          {/* Loading State */}
          {createAdMutation.isPending && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 text-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-lg font-semibold text-[#1F3F3A]">מפרסם מודעה...</p>
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="mt-8">
            {currentStep === 1 && (
              <HolidayRentStep1
                data={wizardData.step1 || {}}
                onNext={handleStep1Next}
              />
            )}
            {currentStep === 2 && (
              <HolidayRentStep2
                data={wizardData.step2 || {}}
                onNext={handleStep2Next}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <HolidayRentStep3
                data={wizardData.step3 || {}}
                isPaid={wizardData.step2?.isPaid ?? true}
                onNext={handleStep3Next}
                onBack={handleBack}
              />
            )}
            {currentStep === 4 && (
              <HolidayRentStep4
                data={wizardData.step4 || {}}
                onNext={handleStep4Next}
                onBack={handleBack}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayWizard;
