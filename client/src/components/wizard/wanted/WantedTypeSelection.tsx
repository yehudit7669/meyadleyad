import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WANTED_TYPE_OPTIONS } from '../../../constants/adTypes';
import { AdType } from '../../../types/wizard';

const WantedTypeSelection: React.FC = () => {
  const navigate = useNavigate();

  const handleTypeSelect = (type: AdType) => {
    switch (type) {
      case AdType.WANTED_FOR_SALE:
        navigate('/publish/wanted/for-sale');
        break;
      case AdType.WANTED_FOR_RENT:
        navigate('/publish/wanted/for-rent');
        break;
      case AdType.WANTED_HOLIDAY:
        navigate('/publish/wanted/holiday');
        break;
      case AdType.WANTED_COMMERCIAL:
        // TODO: Implement when ready
        alert('נכס מסחרי בהכנה - בקרוב!');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12" dir="rtl">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1F3F3A] mb-4">
            דרושים - מחפש נכס
          </h1>
          <p className="text-lg text-gray-600">
            בחר את סוג הנכס שאתה מחפש
          </p>
        </div>

        {/* Type Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {WANTED_TYPE_OPTIONS.map((option) => (
            <button
              key={option.type}
              onClick={() => handleTypeSelect(option.type)}
              disabled={option.type === AdType.WANTED_COMMERCIAL}
              className={`
                p-8 rounded-lg shadow-md transition-all
                ${option.type === AdType.WANTED_COMMERCIAL
                  ? 'bg-gray-100 cursor-not-allowed opacity-50'
                  : 'bg-white hover:shadow-xl hover:scale-105'
                }
              `}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{option.icon}</div>
                <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">
                  {option.title}
                </h2>
                <p className="text-gray-600">{option.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/publish')}
            className="px-8 py-3 bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] rounded-lg font-medium hover:bg-[#1F3F3A] hover:text-white transition-all"
          >
            ← חזרה לבחירת סוג מודעה
          </button>
        </div>
      </div>
    </div>
  );
};

export default WantedTypeSelection;
