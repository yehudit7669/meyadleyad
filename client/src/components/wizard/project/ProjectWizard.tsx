import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProjectWizard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <h1 className="text-3xl font-bold text-[#1F3F3A] mb-4">
            Wizard לפרויקטים
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Wizard זה בהכנה. נשתמש בטופס הקיים בינתיים.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/publish')}
              className="px-6 py-3 bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] rounded-lg font-medium hover:bg-[#1F3F3A] hover:text-white transition-all"
            >
              חזרה לבחירת סוג
            </button>
            <button
              onClick={() => navigate('/ads/new')}
              className="px-6 py-3 bg-[#C9A24D] text-[#1F3F3A] rounded-lg font-bold hover:bg-[#B08C3C] transition-all"
            >
              מעבר לטופס הקיים
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectWizard;
