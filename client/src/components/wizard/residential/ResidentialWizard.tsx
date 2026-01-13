import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adsService, categoriesService } from '../../../services/api';
import { AdType, ResidentialWizardData } from '../../../types/wizard';
import WizardProgress from '../WizardProgress';
import ResidentialStep1 from './ResidentialStep1';
import ResidentialStep2 from './ResidentialStep2';
import ResidentialStep3 from './ResidentialStep3';
import ResidentialStep4 from './ResidentialStep4';
import ResidentialStep5 from './ResidentialStep5';
import ResidentialStep6 from './ResidentialStep6';

const ResidentialWizard: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ adType: string }>();
  const location = useLocation();
  
  // Get adType from params or extract from pathname
  const adType = params.adType || location.pathname.split('/').pop() || 'for_sale';
  
  console.log('ResidentialWizard adType:', adType, 'params:', params, 'pathname:', location.pathname);
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<ResidentialWizardData>>({});
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
      setPublishedAdData(data);
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const stepTitles = ['תיווך', 'כתובת', 'פרטי נכס', 'העלאת תמונה וטקסט', 'פרטים אישיים', 'תצוגה מקדימה'];

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
    // Wait for categories to load
    if (!categories || categories.length === 0) {
      console.error('Categories not loaded yet');
      alert('אנא המתן להטענת המערכת ונסה שנית');
      return;
    }

    // Prepare the API payload with sendCopyToEmail
    const payload = prepareApiPayload(wizardData as ResidentialWizardData, sendCopyToEmail);

    // Submit to API
    createMutation.mutate(payload);
  };

  const prepareApiPayload = (data: ResidentialWizardData, sendCopyToEmail: boolean) => {
    const step2 = data.step2!;
    const step3 = data.step3!;
    const step4 = data.step4 || { description: '', images: [], floorPlan: null };
    const step5 = data.step5!;

    // Determine adType and categorySlug from URL
    let finalAdType = AdType.FOR_SALE;
    let categorySlug = 'apartments-for-sale';
    
    if (adType === 'for_rent') {
      finalAdType = AdType.FOR_RENT;
      categorySlug = 'apartments-for-rent';
    } else if (adType === 'unit') {
      finalAdType = AdType.UNIT;
      categorySlug = 'housing-units'; // או apartments-for-rent, תלוי במבנה ה-DB שלך
    }

    // Find categoryId from categories
    const category = categories?.find((cat: any) => cat.slug === categorySlug);
    const categoryId = category?.id;

    if (!categoryId) {
      console.error('Category not found for slug:', categorySlug);
      throw new Error('לא נמצאה קטגוריה מתאימה');
    }

    // Build title based on property details
    const title = `${getRoomsLabel(step3.rooms)} חדרים ב${step2.streetName}, ${
      step2.neighborhoodName
    }`;

    // Clean features - remove hasOption if not for_sale
    const cleanedFeatures: any = { ...step3.features };
    if (adType !== 'for_sale') {
      delete cleanedFeatures.hasOption;
    }

    return {
      title,
      description: step4.description, // Description now in step 4
      price: step3.price,
      categoryId,
      adType: finalAdType,
      cityId: step2.cityId,
      streetId: step2.streetId,
      houseNumber: step2.houseNumber,
      address: `${step2.streetName} ${step2.houseNumber}${
        step2.addressSupplement ? ', ' + step2.addressSupplement : ''
      }`,
      contactName: step5.contactName,
      contactPhone: step5.contactPhone,
      sendCopyToEmail,
      customFields: {
        // Step 1
        hasBroker: data.step1!.hasBroker,
        // Step 2
        addressSupplement: step2.addressSupplement,
        // Step 3
        propertyType: step3.propertyType,
        rooms: step3.rooms,
        squareMeters: step3.squareMeters,
        condition: step3.condition,
        floor: step3.floor,
        balconies: step3.balconies,
        furniture: step3.furniture,
        entryDate: step3.entryDate,
        arnona: step3.arnona,
        vaad: step3.vaad,
        features: cleanedFeatures,
        // Step 4
        floorPlan: step4.floorPlan,
      },
      images: step4.images || [],
    };
  };

  const getRoomsLabel = (rooms: number): string => {
    if (rooms % 1 === 0) {
      return rooms.toString();
    }
    return rooms.toString().replace('.', ',');
  };

  const getAdTypeTitle = () => {
    switch (adType) {
      case 'for_sale':
        return 'דירה לקניה';
      case 'for_rent':
        return 'דירה להשכרה';
      case 'unit':
        return 'יחידת דיור';
      default:
        return 'פרסום מודעה';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1F3F3A] mb-2">{getAdTypeTitle()}</h1>
            <p className="text-gray-600">מלא את הפרטים שלב אחר שלב</p>
          </div>

          {/* Progress */}
          <WizardProgress
            currentStep={currentStep}
            totalSteps={6}
            stepTitles={stepTitles}
          />

          {/* Steps */}
          <div className="mt-8">
            {showSuccess ? (
              /* Success Screen */
              <div className="text-center py-16 px-4 animate-fadeIn">
                {/* Success Icon */}
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-8 shadow-2xl animate-bounce">
                  <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Main Message */}
                <h2 className="text-4xl font-bold text-[#1F3F3A] mb-4">
                  🎉 המודעה פורסמה בהצלחה!
                </h2>
                
                {/* Ad Number Highlight */}
                <div className="bg-gradient-to-br from-[#C9A24D]/20 to-[#B08C3C]/20 border-2 border-[#C9A24D] rounded-xl p-6 mb-6 max-w-md mx-auto">
                  <p className="text-gray-600 text-sm mb-2">מספר המודעה שלך:</p>
                  <p className="text-5xl font-bold text-[#C9A24D]">
                    #{publishedAdData?.adNumber || publishedAdData?.id}
                  </p>
                </div>

                {/* Additional Info */}
                <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
                  המודעה שלך פעילה ומוצגת באתר 🏠
                </p>

                {/* Action Buttons */}
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
              <>
                {currentStep === 1 && (
                  <ResidentialStep1
                    data={wizardData.step1}
                    onNext={handleStepNext}
                    onPrev={handleStepPrev}
                    isFirst={true}
                  />
                )}
                {currentStep === 2 && (
                  <ResidentialStep2
                    data={wizardData.step2}
                    onNext={handleStepNext}
                    onPrev={handleStepPrev}
                  />
                )}
                {currentStep === 3 && (
                  <ResidentialStep3
                    data={wizardData.step3}
                    onNext={handleStepNext}
                    onPrev={handleStepPrev}
                    adType={adType}
                  />
                )}
                {currentStep === 4 && (
                  <ResidentialStep4
                    data={wizardData.step4}
                    onNext={handleStepNext}
                    onPrev={handleStepPrev}
                  />
                )}
                {currentStep === 5 && (
                  <ResidentialStep5
                    data={wizardData.step5}
                    onNext={handleStepNext}
                    onPrev={handleStepPrev}
                  />
                )}
                {currentStep === 6 && (
                  <ResidentialStep6
                    wizardData={wizardData}
                    onSubmit={handleFinalSubmit}
                    onPrev={handleStepPrev}
                    isLoading={createMutation.isPending}
                  />
                )}
              </>
            )}
          </div>

          {/* Error Display */}
          {createMutation.isError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold mb-1">שגיאה בפרסום המודעה</p>
              <p className="text-red-600 text-sm">
                {(createMutation.error as any)?.response?.data?.message ||
                  'אירעה שגיאה בפרסום המודעה. אנא נסה שנית.'}
              </p>
            </div>
          )}

          {/* Loading State */}
          {createMutation.isPending && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#C9A24D] mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-[#1F3F3A]">מפרסם את המודעה...</p>
                <p className="text-sm text-gray-600 mt-2">אנא המתן</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentialWizard;
