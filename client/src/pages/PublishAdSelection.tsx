import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AD_TYPE_OPTIONS } from '../constants/adTypes';
import { AdType } from '../types/wizard';

const PublishAdSelection: React.FC = () => {
  const navigate = useNavigate();

  const handleAdTypeSelect = (adType: AdType) => {
    if (adType === AdType.JOB) {
      navigate('/publish/wizard/job');
    } else if (adType === AdType.SERVICE_PROVIDERS) {
      navigate('/publish/wizard/service_providers');
    } else if (adType === AdType.SHARED_TABU) {
      navigate('/publish/wizard/shared_ownership');
    } else {
      navigate(`/publish/wizard/${adType.toLowerCase()}`);
    }
  };

  // Filter out SERVICE_PROVIDERS and PROJECT from display
  const displayAdTypes = AD_TYPE_OPTIONS.filter(
    option => option.type !== AdType.SERVICE_PROVIDERS && option.type !== AdType.PROJECT
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12" dir="rtl">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1F3F3A] mb-4">
            איזו מודעה תרצה לפרסם?
          </h1>
          <p className="text-lg text-gray-600">
            בחר את סוג המודעה המתאימה לצרכים שלך
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayAdTypes.map((option) => (
            <button
              key={option.type}
              onClick={() => handleAdTypeSelect(option.type)}
              className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden p-6 text-right focus:outline-none focus:ring-4 focus:ring-[#C9A24D] focus:ring-opacity-50"
            >
              {/* Icon Background */}
              <div className={`absolute top-0 left-0 w-20 h-20 ${option.color} opacity-10 rounded-br-full transform group-hover:scale-150 transition-transform duration-300`}></div>
              
              {/* Icon */}
              <div className="relative text-5xl mb-4">{option.icon}</div>
              
              {/* Title */}
              <h3 className="relative text-xl font-bold text-[#1F3F3A] mb-2 group-hover:text-[#C9A24D] transition-colors">
                {option.title}
              </h3>
              
              {/* Description */}
              <p className="relative text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                {option.description}
              </p>
              
              {/* Hover Arrow */}
              <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg 
                  className="w-6 h-6 text-[#C9A24D]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 7l5 5m0 0l-5 5m5-5H6" 
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/')}
            className="text-[#1F3F3A] hover:text-[#C9A24D] font-medium transition-colors inline-flex items-center gap-2"
          >
            <svg 
              className="w-5 h-5 rotate-180" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 7l5 5m0 0l-5 5m5-5H6" 
              />
            </svg>
            חזרה לדף הבית
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishAdSelection;
