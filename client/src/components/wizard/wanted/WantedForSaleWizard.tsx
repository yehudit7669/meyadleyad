import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adsService, categoriesService } from '../../../services/api';
import { AdType, WantedForSaleWizardData } from '../../../types/wizard';
import WizardProgress from '../WizardProgress';
import WantedForSaleStep1 from './WantedForSaleStep1';
import WantedForSaleStep2 from './WantedForSaleStep2';
import WantedForSaleStep3 from './WantedForSaleStep3';
import WantedForSaleStep4 from './WantedForSaleStep4';

const WantedForSaleWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<WantedForSaleWizardData>>({
    adType: AdType.WANTED_FOR_SALE,
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
      // Last step - submit
      handleFinalSubmit({ ...wizardData, step4: stepData } as WantedForSaleWizardData);
    } else {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepPrev = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (data: WantedForSaleWizardData) => {
    const payload = prepareApiPayload(data);
    createMutation.mutate(payload);
  };

  const prepareApiPayload = (data: WantedForSaleWizardData) => {
    // Find wanted-for-sale category
    const categorySlug = 'wanted-for-sale'; // או כל slug שהגדרת ב-DB
    const category = categories?.find((cat: any) => cat.slug === categorySlug);
    
    if (!category) {
      // Fallback to apartments-for-sale if wanted category doesn't exist
      const fallbackCategory = categories?.find((cat: any) => cat.slug === 'apartments-for-sale');
      if (!fallbackCategory) {
        throw new Error('לא נמצאה קטגוריה מתאימה');
      }
    }

    const categoryId = category?.id || categories?.find((cat: any) => cat.slug === 'apartments-for-sale')?.id;

    const title = `דרוש: ${data.step3.rooms} חדרים ${data.step2.desiredStreet ? `ב${data.step2.desiredStreet}` : ''}`;

    // For wanted ads: send adType and requestedLocationText
    // Do NOT send cityId/streetId/houseNumber - backend handles this
    return {
      title,
      description: `מחפש לקנות דירה: ${data.step3.rooms} חדרים, ${data.step3.squareMeters} מ"ר`,
      price: data.step3.priceRequested,
      categoryId,
      adType: AdType.WANTED_FOR_SALE,
      requestedLocationText: data.step2.desiredStreet,
      contactName: data.step4.contactName,
      contactPhone: data.step4.contactPhone,
      sendCopyToEmail: data.step4.sendCopyToEmail,
      customFields: {
        hasBroker: data.step1.hasBroker,
        desiredStreet: data.step2.desiredStreet,
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
        isWanted: true, // Important flag to distinguish from regular ads
      },
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-[#1F3F3A] mb-2">
            דרוש: דירה לקניה
          </h1>
          <p className="text-gray-600">מחפש לקנות דירה</p>
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
            <WantedForSaleStep1
              data={wizardData.step1}
              onNext={handleStepNext}
              onPrev={handleStepPrev}
              isFirst={true}
            />
          )}
          {currentStep === 2 && (
            <WantedForSaleStep2
              data={wizardData.step2}
              onNext={handleStepNext}
              onPrev={handleStepPrev}
            />
          )}
          {currentStep === 3 && (
            <WantedForSaleStep3
              data={wizardData.step3}
              onNext={handleStepNext}
              onPrev={handleStepPrev}
            />
          )}
          {currentStep === 4 && (
            <WantedForSaleStep4
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

export default WantedForSaleWizard;
