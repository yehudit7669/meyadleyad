import React, { useState } from 'react';
import { useBrokerProfile } from '../hooks/useBroker';
import PersonalDetailsTab from '../components/broker/PersonalDetailsTab';
import TeamManagementTab from '../components/broker/TeamManagementTab';
import BrandingTab from '../components/broker/BrandingTab';
import MyAdsTab from '../components/broker/MyAdsTab';
import AppointmentsTab from '../components/broker/AppointmentsTab';
import CommunicationTab from '../components/broker/CommunicationTab';
import AccountManagementTab from '../components/broker/AccountManagementTab';
import FeaturedRequestTab from '../components/broker/FeaturedRequestTab';
import ShareTab from '../components/broker/ShareTab';
import AuditLogTab from '../components/broker/AuditLogTab';

type TabType =
  | 'personal'
  | 'team'
  | 'branding'
  | 'ads'
  | 'appointments'
  | 'communication'
  | 'share'
  | 'account'
  | 'audit'
  | 'featured';

const MyBrokerProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const { data: profile, isLoading, error } = useBrokerProfile();

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
    { id: 'team', label: 'ניהול צוות', icon: '👥' },
    { id: 'branding', label: 'מיתוג ועמוד עסקי', icon: '🎨' },
    { id: 'ads', label: 'המודעות שלי', icon: '📢' },
    { id: 'appointments', label: 'יומן פגישות', icon: '📅' },
    { id: 'communication', label: 'תקשורת ודיוור', icon: '📧' },
    { id: 'share', label: 'שיתוף קל', icon: '🔗' },
    { id: 'account', label: 'ניהול חשבון', icon: '⚙️' },
    { id: 'audit', label: 'לוג מערכת', icon: '📝' },
    { id: 'featured', label: 'בקשת הדגשה', icon: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">פרופיל מתווך</h1>
          <p className="text-gray-600">
            שלום {profile.user.name || 'מתווך'}! ברוך הבא לאזור הניהול האישי שלך
          </p>
          {profile.stats && (
            <div className="mt-4 flex gap-6">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-600">סה״כ מודעות: </span>
                <span className="font-bold text-blue-600">{profile.stats.totalAds}</span>
              </div>
              <div className="bg-green-50 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-600">מודעות פעילות: </span>
                <span className="font-bold text-green-600">{profile.stats.activeAds}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs Navigation - Desktop */}
        <div className="hidden lg:block bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-colors
                  ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <label htmlFor="tab-select" className="block text-sm font-medium text-gray-700 mb-2">
            בחר טאב:
          </label>
          <select
            id="tab-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabType)}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          {activeTab === 'personal' && <PersonalDetailsTab profile={profile} />}
          {activeTab === 'team' && <TeamManagementTab />}
          {activeTab === 'branding' && <BrandingTab profile={profile} />}
          {activeTab === 'ads' && <MyAdsTab />}
          {activeTab === 'appointments' && <AppointmentsTab />}
          {activeTab === 'communication' && <CommunicationTab profile={profile} />}
          {activeTab === 'share' && <ShareTab />}
          {activeTab === 'account' && <AccountManagementTab />}
          {activeTab === 'audit' && <AuditLogTab />}
          {activeTab === 'featured' && <FeaturedRequestTab />}
        </div>
      </div>
    </div>
  );
};

export default MyBrokerProfile;
