import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceProviderService } from '../services/api';
import SPPersonalDetailsTab from '../components/service-provider/SPPersonalDetailsTab';
import SPBrandingTab from '../components/service-provider/SPBrandingTab';
import SPBusinessHoursTab from '../components/service-provider/SPBusinessHoursTab';
import SPCommunicationTab from '../components/service-provider/SPCommunicationTab';
import SPAccountManagementTab from '../components/service-provider/SPAccountManagementTab';
import SPShareTab from '../components/service-provider/SPShareTab';
import SPHighlightRequestTab from '../components/service-provider/SPHighlightRequestTab';

type TabType =
  | 'personal'
  | 'branding'
  | 'hours'
  | 'communication'
  | 'account'
  | 'share'
  | 'highlight';

const ServiceProviderProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('personal');

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['service-provider-profile'],
    queryFn: serviceProviderService.getProfile,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">טוען פרופיל...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">אירעה שגיאה בטעינת הפרופיל</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'personal', label: 'פרטים אישיים', icon: '👤' },
    { id: 'branding', label: 'מיתוג ועמוד עסקי', icon: '🎨' },
    { id: 'hours', label: 'שעות פעילות', icon: '🕐' },
    { id: 'communication', label: 'תקשורת ודיוור', icon: '📧' },
    { id: 'account', label: 'ניהול חשבון', icon: '⚙️' },
    { id: 'share', label: 'שיתוף קל', icon: '🔗' },
    { id: 'highlight', label: 'בקשת הדגשה', icon: '⭐' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return <SPPersonalDetailsTab profile={profile} onUpdate={refetch} />;
      case 'branding':
        return <SPBrandingTab profile={profile} onUpdate={refetch} />;
      case 'hours':
        return <SPBusinessHoursTab profile={profile} onUpdate={refetch} />;
      case 'communication':
        return <SPCommunicationTab profile={profile} onUpdate={refetch} />;
      case 'account':
        return <SPAccountManagementTab profile={profile} />;
      case 'share':
        return <SPShareTab profile={profile} />;
      case 'highlight':
        return <SPHighlightRequestTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">פרופיל נותן שירות</h1>
          <p className="text-gray-600">
            שלום {profile.name || profile.businessName || 'נותן שירות'}! ברוך הבא לאזור הניהול האישי שלך
          </p>
        </div>

        {/* Tabs Navigation - Desktop */}
        <div className="hidden lg:block bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs Navigation - Mobile */}
        <div className="lg:hidden bg-white rounded-lg shadow-md p-4 mb-6">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabType)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.icon} {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderProfile;
