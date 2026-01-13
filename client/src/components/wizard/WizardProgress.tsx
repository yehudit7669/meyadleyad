import React from 'react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  totalSteps,
  stepTitles,
}) => {
  return (
    <div className="mb-8" dir="rtl">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step < currentStep
                    ? 'bg-green-500 text-white'
                    : step === currentStep
                    ? 'bg-[#C9A24D] text-white ring-4 ring-[#C9A24D] ring-opacity-30'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step
                )}
              </div>
              {stepTitles[step - 1] && (
                <div
                  className={`mt-2 text-xs sm:text-sm font-medium text-center transition-colors ${
                    step === currentStep ? 'text-[#C9A24D]' : 'text-gray-500'
                  }`}
                >
                  {stepTitles[step - 1]}
                </div>
              )}
            </div>
            {step < totalSteps && (
              <div
                className={`flex-1 h-1 mx-2 transition-all ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Counter */}
      <div className="text-center text-sm text-gray-600">
        שלב {currentStep} מתוך {totalSteps}
      </div>
    </div>
  );
};

export default WizardProgress;
