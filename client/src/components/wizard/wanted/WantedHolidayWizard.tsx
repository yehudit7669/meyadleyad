import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adsService, categoriesService } from '../../../services/api';
import { AdType, WantedHolidayWizardData } from '../../../types/wizard';
import WizardProgress from '../WizardProgress';
import WantedHolidayStep1 from './WantedHolidayStep1';
import WantedHolidayStep2 from './WantedHolidayStep2';
import WantedHolidayStep3 from './WantedHolidayStep3';
import WantedHolidayStep4 from './WantedHolidayStep4';

const WantedHolidayWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<WantedHolidayWizardData>>({
    adType: AdType.WANTED_HOLIDAY,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adsService.createAd(data),
    onSuccess: (data) => {
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

  const stepTitles = ['אזור מבוקש', 'בתשלום/ללא תשלום', 'פרטי הנכס', 'פרטי התקשרות'];

  const handleStepNext = (stepData: any) => {
    const stepKey = `step${currentStep}`;
    setWizardData((prev) => ({
      ...prev,
      [stepKey]: stepData,
    }));
    
    if (currentStep === 4) {
      handleFinalSubmit({ ...wizardData, step4: stepData } as WantedHolidayWizardData);
    } else {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepPrev = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (data: WantedHolidayWizardData) => {
    const payload = prepareApiPayload(data);
    createMutation.mutate(payload);
  };

  const prepareApiPayload = (data: WantedHolidayWizardData) => {
    const categorySlug = 'wanted-shabbat';
    const category = categories?.find((cat: any) => cat.slug === categorySlug);
    
    if (!category) {
      const fallbackCategory = categories?.find((cat: any) => cat.slug === 'shabbat-apartments');
      if (!fallbackCategory) {
        throw new Error('לא נמצאה קטגוריה מתאימה');
      }
    }

    const categoryId = category?.id || categories?.find((cat: any) => cat.slug === 'shabbat-apartments')?.id;

    const title = `דרוש: דירה לשבת - ${data.step3.parasha}${data.step3.rooms ? `, ${data.step3.rooms} חדרים` : ''}`;
    const isPaid = data.step2.isPaid;

    // For wanted ads: send adType with structured address (city, street, neighborhood)
    return {
      title,
      description: data.step3.description || undefined,
      price: isPaid && data.step3.priceRequested ? data.step3.priceRequested : undefined,
      categoryId,
      adType: AdType.WANTED_HOLIDAY,
      // Send structured address data
      cityId: data.step1.cityId,
      streetId: data.step1.streetId,
      neighborhood: data.step1.neighborhoodName,
      houseNumber: data.step1.houseNumber,
      addressSupplement: data.step1.addressSupplement,
      // Also send as requestedLocationText for display
      requestedLocationText: `${data.step1.cityName}${data.step1.streetName ? `, ${data.step1.streetName}` : ''}${data.step1.neighborhoodName ? `, ${data.step1.neighborhoodName}` : ''}`,
      contactName: data.step4.contactName,
      contactPhone: data.step4.contactPhone,
      customFields: {
        // Keep address data in customFields too for compatibility
        cityId: data.step1.cityId,
        cityName: data.step1.cityName,
        streetId: data.step1.streetId,
        streetName: data.step1.streetName,
        neighborhoodId: data.step1.neighborhoodId,
        neighborhoodName: data.step1.neighborhoodName,
        houseNumber: data.step1.houseNumber,
        addressSupplement: data.step1.addressSupplement,
        isPaid: data.step2.isPaid,
        parasha: data.step3.parasha,
        propertyType: data.step3.propertyType,
        rooms: data.step3.rooms,
        purpose: data.step3.purpose,
        floor: data.step3.floor,
        balconiesCount: data.step3.balconiesCount,
        priceRequested: isPaid ? data.step3.priceRequested : undefined,
        features: data.step3.features,
        isWanted: true,
      },
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-[#1F3F3A] mb-2">
            דרוש: דירה לשבת
          </h1>
          <p className="text-gray-600">מחפש דירה לשבת/חג</p>
        </div>

        {/* Progress Bar */}
        <WizardProgress
          currentStep={currentStep}
          totalSteps={4}
          stepTitles={stepTitles}
        />

        {/* Steps */}
        <div className="bg-white rounded-lg shadow-md p-8 mt-8">
          {currentStep === 1 && (
            <WantedHolidayStep1
              data={wizardData.step1}
              onNext={handleStepNext}
              onPrev={handleStepPrev}
              isFirst={true}
            />
          )}
          {currentStep === 2 && (
            <WantedHolidayStep2
              data={wizardData.step2}
              onNext={handleStepNext}
              onPrev={handleStepPrev}
            />
          )}
          {currentStep === 3 && (
            <WantedHolidayStep3
              data={wizardData.step3}
              onNext={handleStepNext}
              onPrev={handleStepPrev}
              isPaid={wizardData.step2?.isPaid || false}
            />
          )}
          {currentStep === 4 && (
            <WantedHolidayStep4
              data={wizardData.step4}
              onNext={handleStepNext}
              onPrev={handleStepPrev}
              isLast={true}
              isLoading={createMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WantedHolidayWizard;
