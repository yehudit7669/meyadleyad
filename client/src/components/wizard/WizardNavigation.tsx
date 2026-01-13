import React from 'react';

interface WizardNavigationProps {
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isValid?: boolean;
  isLoading?: boolean;
  nextButtonText?: string;
  submitButtonText?: string;
}

const WizardNavigation: React.FC<WizardNavigationProps> = ({
  onPrev,
  onNext,
  onSubmit,
  isFirstStep = false,
  isLastStep = false,
  isValid = true,
  isLoading = false,
  nextButtonText = 'הבא',
  submitButtonText = 'פרסם מודעה',
}) => {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8" dir="rtl">
      {/* Previous Button */}
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirstStep || isLoading}
        className={`px-6 py-3 rounded-lg font-medium transition-all ${
          isFirstStep || isLoading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] hover:bg-[#1F3F3A] hover:text-white'
        }`}
      >
        ← הקודם
      </button>

      {/* Next/Submit Button */}
      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || isLoading}
          className={`px-8 py-3 rounded-lg font-bold transition-all ${
            !isValid || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#C9A24D] text-[#1F3F3A] hover:bg-[#B08C3C] shadow-lg hover:shadow-xl'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>מפרסם...</span>
            </div>
          ) : (
            submitButtonText
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!isValid || isLoading}
          className={`px-8 py-3 rounded-lg font-bold transition-all ${
            !isValid || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#C9A24D] text-[#1F3F3A] hover:bg-[#B08C3C] shadow-lg hover:shadow-xl'
          }`}
        >
          {nextButtonText} →
        </button>
      )}
    </div>
  );
};

export default WizardNavigation;
