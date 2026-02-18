import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adsService, categoriesService } from '../../../services/api';
import { AdType, WantedForRentWizardData } from '../../../types/wizard';
import WizardProgress from '../WizardProgress';
import WantedForRentStep1 from './WantedForRentStep1';
import WantedForRentStep2 from './WantedForRentStep2';
import WantedForRentStep3 from './WantedForRentStep3';
import WantedForRentStep4 from './WantedForRentStep4';

const WantedForRentWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<WantedForRentWizardData>>({
    adType: AdType.WANTED_FOR_RENT,
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

  const stepTitles = ['תיווך', 'רחוב מבוקש', 'פרטי הנכס', 'פרטי התקשרות'];

  const handleStepNext = (stepData: any) => {
    const stepKey = `step${currentStep}`;
    setWizardData((prev) => ({
      ...prev,
      [stepKey]: stepData,
    }));
    
    if (currentStep === 4) {
      handleFinalSubmit({ ...wizardData, step4: stepData } as WantedForRentWizardData);
    } else {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepPrev = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (data: WantedForRentWizardData) => {
    const payload = prepareApiPayload(data);
    createMutation.mutate(payload);
  };

  const prepareApiPayload = (data: WantedForRentWizardData) => {
    const categorySlug = 'wanted-for-rent';
    const category = categories?.find((cat: any) => cat.slug === categorySlug);
    
    if (!category) {
      const fallbackCategory = categories?.find((cat: any) => cat.slug === 'apartments-for-rent');
      if (!fallbackCategory) {
        throw new Error('לא נמצאה קטגוריה מתאימה');
      }
    }

    const categoryId = category?.id || categories?.find((cat: any) => cat.slug === 'apartments-for-rent')?.id;

    const title = `דרוש: ${data.step3.rooms ? `${data.step3.rooms} חדרים` : 'דירה'} להשכרה ${data.step2.cityName ? `ב${data.step2.cityName}` : ''}`;

    // For wanted ads: send adType with structured address (city, street, neighborhood)
    return {
      title,
      description: data.step3.description || undefined,
      price: data.step3.priceRequested,
      categoryId,
      adType: AdType.WANTED_FOR_RENT,
      // Send structured address data
      cityId: data.step2.cityId,
      streetId: data.step2.streetId,
      neighborhood: data.step2.neighborhoodName,
      houseNumber: data.step2.houseNumber,
      addressSupplement: data.step2.addressSupplement,
      // Also send as requestedLocationText for display
      requestedLocationText: `${data.step2.cityName}${data.step2.streetName ? `, ${data.step2.streetName}` : ''}${data.step2.neighborhoodName ? `, ${data.step2.neighborhoodName}` : ''}`,
      contactName: data.step4.contactName,
      contactPhone: data.step4.contactPhone,
      customFields: {
        hasBroker: data.step1.hasBroker,
        // Keep address data in customFields too for compatibility
        cityId: data.step2.cityId,
        cityName: data.step2.cityName,
        streetId: data.step2.streetId,
        streetName: data.step2.streetName,
        neighborhoodId: data.step2.neighborhoodId,
        neighborhoodName: data.step2.neighborhoodName,
        houseNumber: data.step2.houseNumber,
        addressSupplement: data.step2.addressSupplement,
        propertyType: data.step3.propertyType,
        rooms: data.step3.rooms,
        squareMeters: data.step3.squareMeters,
        floor: data.step3.floor,
        balconies: data.step3.balconies,
        condition: data.step3.condition,
        furniture: data.step3.furniture,
        features: data.step3.features,
        arnona: data.step3.arnona,
        vaad: data.step3.vaad,
        entryDate: data.step3.entryDate,
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
            דרוש: דירה להשכרה
          </h1>
          <p className="text-gray-600">מחפש לשכור דירה</p>
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
            <WantedForRentStep1
              data={wizardData.step1}
              onNext={handleStepNext}
              onPrev={handleStepPrev}
              isFirst={true}
            />
          )}
          {currentStep === 2 && (
            <WantedForRentStep2
              data={wizardData.step2}
              onNext={handleStepNext}
              onPrev={handleStepPrev}
            />
          )}
          {currentStep === 3 && (
            <WantedForRentStep3
              data={wizardData.step3}
              onNext={handleStepNext}
              onPrev={handleStepPrev}
            />
          )}
          {currentStep === 4 && (
            <WantedForRentStep4
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

export default WantedForRentWizard;
