import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adsService, categoriesService } from '../../../services/api';
import { AdType } from '../../../types/wizard';
import WizardProgress from '../WizardProgress';
import CommercialSpaceStep1 from './CommercialSpaceStep1';
import CommercialSpaceStep2 from './CommercialSpaceStep2';
import CommercialSpaceStep3 from './CommercialSpaceStep3';
import CommercialSpaceStep4 from './CommercialSpaceStep4';
import CommercialSpaceStep6 from './CommercialSpaceStep6';
import CommercialSpacePreview from './CommercialSpacePreview';

interface CommercialSpaceWizardData {
  step1?: any;
  step2?: any;
  step3?: any;
  step4?: any;
  step5?: any;
}

const CommercialSpaceWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<CommercialSpaceWizardData>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [publishedAdData, setPublishedAdData] = useState<any>(null);

  // Load categories to get categoryId
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adsService.createAd(data),
    onSuccess: (data) => {
      console.log('✅ Ad created successfully:', data);
      setPublishedAdData(data);
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error: any) => {
      console.error('❌ Error creating ad:', error);
      console.error('Error response:', error?.response?.data);
      alert('שגיאה בפרסום המודעה: ' + (error?.response?.data?.message || error.message));
    },
  });

  const totalSteps = 6; // סה"כ 6 שלבים
  const stepTitles = ['סוג עסקה', 'תיווך', 'כתובת', 'פרטי נכס', 'פרטים אישיים', 'תצוגה מקדימה'];

  const handleStepNext = (stepData: any) => {
    setWizardData((prev) => ({
      ...prev,
      [`step${currentStep}`]: stepData,
    }));
    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepPrev = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (sendCopyToEmail: boolean) => {
    console.log('🚀 handleFinalSubmit called - CommercialSpace');
    console.log('Categories:', categories);
    console.log('Wizard Data:', wizardData);
    
    if (!categories || categories.length === 0) {
      console.error('Categories not loaded yet');
      alert('אנא המתן להטענת המערכת ונסה שנית');
      return;
    }

    try {
      const payload = prepareApiPayload(wizardData, sendCopyToEmail);
      console.log('📤 Payload to send:', payload);
      createMutation.mutate(payload);
    } catch (error) {
      console.error('❌ Error preparing payload:', error);
      alert('שגיאה בהכנת הנתונים: ' + (error as Error).message);
    }
  };

  const prepareApiPayload = (data: CommercialSpaceWizardData, sendCopyToEmail: boolean) => {
    console.log('📋 Preparing API payload...');
    console.log('Data received:', data);
    console.log('🏷️ Available categories:', categories);
    
    const step1 = data.step1!;
    const step2 = data.step2!;
    const step3 = data.step3!;
    const step4 = data.step4!;
    const step5 = data.step5!;

    // Find categoryId for commercial-real-estate
    let category = categories?.find((cat: any) => cat.slug === 'commercial-real-estate');
    if (!category) {
      category = categories?.find((cat: any) => cat.slug === 'commercial-space');
    }
    if (!category) {
      category = categories?.find((cat: any) => cat.nameHe === 'שטח מסחרי');
    }
    
    const categoryId = category?.id;

    console.log('🏷️ Category found:', category);
    console.log('Category ID:', categoryId);

    if (!categoryId) {
      console.error('Category not found. Available categories:', categories?.map((c: any) => ({ slug: c.slug, nameHe: c.nameHe })));
      throw new Error('לא נמצאה קטגוריה שטח מסחרי. אנא וודא שהקטגוריה קיימת במערכת.');
    }

    // Build title based on property details
    const locationText = step3.streetName 
      ? `${step3.streetName}, ${step3.neighborhoodName}`
      : step3.neighborhoodName;
    
    const commercialTypeLabels: Record<string, string> = {
      STORE: 'חנות',
      CLINIC: 'קליניקה',
      WAREHOUSE: 'מחסן',
      GALLERY: 'גלריה',
      OFFICE: 'משרד',
      OPERATIONAL_SPACE: 'שטח תפעולי',
      HANGAR: 'האנגר',
      SHOWROOM: 'אולם תצוגה',
    };
    
    const typeLabel = commercialTypeLabels[step4.commercialType || ''] || 'שטח מסחרי';
    const transactionLabel = step1.transactionType === 'FOR_RENT' ? 'להשכרה' : 'למכירה';
    const title = `${typeLabel} ${transactionLabel} ב${locationText}`;
    console.log('📝 Generated title:', title);

    return {
      title,
      description: step4.description || '',
      price: step4.price,
      categoryId,
      adType: step1.transactionType === 'FOR_RENT' ? AdType.FOR_RENT : AdType.FOR_SALE,
      cityId: step3.cityId,
      streetId: step3.streetId,
      houseNumber: step3.houseNumber,
      neighborhoodName: step3.neighborhoodName,
      address: `${step3.streetName || step3.neighborhoodName} ${step3.houseNumber || ''}${
        step3.addressSupplement ? ', ' + step3.addressSupplement : ''
      }`,
      contactName: step5.contactName,
      contactPhone: step5.contactPhone,
      weeklyDigestOptIn: step5.weeklyDigestOptIn || false,
      sendCopyToEmail,
      customFields: {
        transactionType: step1.transactionType,
        brokerType: step2.brokerType,
        addressSupplement: step3.addressSupplement,
        commercialType: step4.commercialType,
        area: step4.area,
        floor: step4.floor,
        price: step4.price,
        arnona: step4.arnona,
        entryDate: step4.entryDate,
        features: step4.features,
      },
      images: [],
    };
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CommercialSpaceStep1
            data={wizardData.step1}
            onNext={handleStepNext}
            onPrev={handleStepPrev}
          />
        );
      case 2:
        return (
          <CommercialSpaceStep2
            data={wizardData.step2}
            onNext={handleStepNext}
            onPrev={handleStepPrev}
          />
        );
      case 3:
        return (
          <CommercialSpaceStep3
            data={wizardData.step3}
            onNext={handleStepNext}
            onPrev={handleStepPrev}
          />
        );
      case 4:
        return (
          <CommercialSpaceStep4
            data={wizardData.step4}
            onNext={handleStepNext}
            onPrev={handleStepPrev}
          />
        );
      case 5:
        return (
          <CommercialSpaceStep6
            data={wizardData.step5}
            onNext={handleStepNext}
            onPrev={handleStepPrev}
          />
        );
      case 6:
        return (
          <CommercialSpacePreview
            wizardData={wizardData}
            onSubmit={handleFinalSubmit}
            onPrev={handleStepPrev}
            isLoading={createMutation.isPending}
          />
        );
      default:
        return <div>שלב {currentStep} - בפיתוח</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1F3F3A] mb-2">פרסום מודעה - שטח מסחרי</h1>
            <p className="text-gray-600">מלא את הפרטים שלב אחר שלב</p>
          </div>

          {/* Progress */}
          <WizardProgress
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepTitles={stepTitles}
          />

          {/* Steps */}
          <div className="mt-8">
            {showSuccess ? (
              /* Success Screen */
              <div className="text-center py-16 px-4 animate-fadeIn">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-8 shadow-2xl animate-bounce">
                  <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h2 className="text-4xl font-bold text-[#1F3F3A] mb-4">
                  🎉 המודעה פורסמה בהצלחה!
                </h2>
                
                <div className="bg-gradient-to-br from-[#C9A24D]/20 to-[#B08C3C]/20 border-2 border-[#C9A24D] rounded-xl p-6 mb-6 max-w-md mx-auto">
                  <p className="text-gray-600 text-sm mb-2">מספר המודעה שלך:</p>
                  <p className="text-5xl font-bold text-[#C9A24D]">
                    #{publishedAdData?.adNumber || publishedAdData?.id}
                  </p>
                </div>

                <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
                  המודעה שלך פעילה ומוצגת באתר 🏢
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => navigate(`/ads/${publishedAdData?.id}`)}
                    className="w-full sm:w-auto px-10 py-4 bg-[#C9A24D] text-[#1F3F3A] rounded-lg font-bold hover:bg-[#B08C3C] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
                  >
                    👁️ צפייה במודעה
                  </button>
                  <button
                    onClick={() => {
                      setShowSuccess(false);
                      setCurrentStep(1);
                      setWizardData({});
                      setPublishedAdData(null);
                    }}
                    className="w-full sm:w-auto px-10 py-4 bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] rounded-lg font-medium hover:bg-[#1F3F3A] hover:text-white transition-all text-lg"
                  >
                    ➕ פרסום מודעה נוספת
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full sm:w-auto px-10 py-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all text-lg"
                  >
                    🏠 חזרה לדף הבית
                  </button>
                </div>
              </div>
            ) : (
              renderStep()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommercialSpaceWizard;
