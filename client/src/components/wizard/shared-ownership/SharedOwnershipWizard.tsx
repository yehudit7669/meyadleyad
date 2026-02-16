import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adsService, categoriesService } from '../../../services/api';
import { AdType, SharedOwnershipWizardData } from '../../../types/wizard';
import WizardProgress from '../WizardProgress';
import SharedOwnershipStep1 from './SharedOwnershipStep1';
import SharedOwnershipStep2 from './SharedOwnershipStep2';
import SharedOwnershipStep3 from './SharedOwnershipStep3';
import SharedOwnershipStep5 from './SharedOwnershipStep5';
import SharedOwnershipStep6 from './SharedOwnershipStep6';

const SharedOwnershipWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<SharedOwnershipWizardData>>({});
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
    },
  });

  const stepTitles = ['תיווך', 'כתובת', 'פרטי נכס', 'פרטים אישיים', 'תצוגה מקדימה'];

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
    console.log('🚀 handleFinalSubmit called - SharedOwnership');
    console.log('Categories:', categories);
    console.log('Wizard Data:', wizardData);
    
    if (!categories || categories.length === 0) {
      console.error('Categories not loaded yet');
      alert('אנא המתן להטענת המערכת ונסה שנית');
      return;
    }

    try {
      const payload = prepareApiPayload(wizardData as SharedOwnershipWizardData, sendCopyToEmail);
      console.log('📤 Payload to send:', payload);
      createMutation.mutate(payload);
    } catch (error) {
      console.error('❌ Error preparing payload:', error);
      alert('שגיאה בהכנת הנתונים: ' + (error as Error).message);
    }
  };

  const prepareApiPayload = (data: SharedOwnershipWizardData, sendCopyToEmail: boolean) => {
    console.log('📋 Preparing API payload...');
    console.log('Data received:', data);
    console.log('🏷️ Available categories:', categories);
    
    const step2 = data.step2!;
    const step3 = data.step3!;
    const step4 = data.step4 as any; // Contact details (was step5 before removing images step)

    // Find categoryId from categories - try multiple possible slugs
    let category = categories?.find((cat: any) => cat.slug === 'shared-tabu');
    if (!category) {
      category = categories?.find((cat: any) => cat.slug === 'shared-ownership');
    }
    if (!category) {
      category = categories?.find((cat: any) => cat.nameHe === 'טאבו משותף');
    }
    
    const categoryId = category?.id;

    console.log('🏷️ Category found:', category);
    console.log('Category ID:', categoryId);

    if (!categoryId) {
      console.error('Category not found. Available categories:', categories?.map((c: any) => ({ slug: c.slug, nameHe: c.nameHe })));
      throw new Error('לא נמצאה קטגוריה טאבו משותף. אנא וודא שהקטגוריה קיימת במערכת.');
    }

    // Build title based on property details
    const locationText = step2.streetName 
      ? `${step2.streetName}, ${step2.neighborhoodName}`
      : step2.neighborhoodName;
    
    const title = `${getRoomsLabel(step3.rooms)} חדרים ב${locationText}`;
    console.log('📝 Generated title:', title);

    return {
      title,
      description: '',
      price: step3.priceRequested,
      categoryId,
      adType: AdType.SHARED_TABU,
      cityId: step2.cityId,
      streetId: step2.streetId,
      houseNumber: step2.houseNumber,
      neighborhoodName: step2.neighborhoodName,
      address: `${step2.streetName || step2.neighborhoodName} ${step2.houseNumber || ''}${
        step2.addressSupplement ? ', ' + step2.addressSupplement : ''
      }`,
      contactName: step4.contactName,
      contactPhone: step4.contactPhone,
      weeklyDigestOptIn: step4.weeklyDigestOptIn || false,
      sendCopyToEmail,
      customFields: {
        hasBroker: data.step1!.hasBroker,
        addressSupplement: step2.addressSupplement,
        propertyType: step3.propertyType,
        rooms: step3.rooms,
        squareMeters: step3.squareMeters,
        condition: step3.condition,
        floor: step3.floor,
        balconies: step3.balconies,
        priceRequested: step3.priceRequested,
        arnona: step3.arnona,
        vaad: step3.vaad,
        requiredEquity: step3.requiredEquity,
        numberOfPartners: step3.numberOfPartners,
        entryDate: step3.entryDate,
        features: step3.features,
      },
      images: [],
    };
  };

  const getRoomsLabel = (rooms: number): string => {
    if (rooms % 1 === 0) {
      return rooms.toString();
    }
    return rooms.toString().replace('.', ',');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1F3F3A] mb-2">טאבו משותף</h1>
            <p className="text-gray-600">מלא את הפרטים שלב אחר שלב</p>
          </div>

          {/* Progress */}
          <WizardProgress
            currentStep={currentStep}
            totalSteps={5}
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
                  המודעה שלך פעילה ומוצגת באתר 🏠
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
                  <SharedOwnershipStep1
                    data={wizardData.step1}
                    onNext={handleStepNext}
                    onPrev={handleStepPrev}
                    isFirst={true}
                  />
                )}
                {currentStep === 2 && (
                  <SharedOwnershipStep2
                    data={wizardData.step2}
                    onNext={handleStepNext}
                    onPrev={handleStepPrev}
                  />
                )}
                {currentStep === 3 && (
                  <SharedOwnershipStep3
                    data={wizardData.step3}
                    onNext={handleStepNext}
                    onPrev={handleStepPrev}
                  />
                )}
                {currentStep === 4 && (
                  <SharedOwnershipStep5
                    data={wizardData.step4}
                    onNext={handleStepNext}
                    onPrev={handleStepPrev}
                  />
                )}
                {currentStep === 5 && (
                  <SharedOwnershipStep6
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

export default SharedOwnershipWizard;
