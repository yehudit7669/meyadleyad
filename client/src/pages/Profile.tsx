import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/api';
import ProfileHeader from '../components/profile/ProfileHeader';
import MyAdsTab from '../components/profile/MyAdsTab';
import FavoritesTab from '../components/profile/FavoritesTab';
import PersonalDetailsTab from '../components/profile/PersonalDetailsTab';
import AppointmentsTab from '../components/profile/AppointmentsTab';
import CommunicationPrefsTab from '../components/profile/CommunicationPrefsTab';
import AccountTab from '../components/profile/AccountTab';

type TabType = 'my-ads' | 'favorites' | 'personal' | 'appointments' | 'communication' | 'account';

export default function Profile() {
  const [activeTab, setActiveTab] = useState<TabType>('my-ads');

  const { data: user } = useQuery({
    queryKey: ['personal-details'],
    queryFn: profileService.getPersonalDetails,
  });

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'my-ads', label: 'המודעות שלי', icon: '📋' },
    { id: 'favorites', label: 'מודעות שאהבתי', icon: '♥' },
    { id: 'personal', label: 'פרטים אישיים', icon: '👤' },
    { id: 'appointments', label: 'לוח תיאומים', icon: '📅' },
    { id: 'communication', label: 'העדפות תקשורת', icon: '📧' },
    { id: 'account', label: 'ניהול חשבון', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileHeader userName={user?.name} />

        {/* Tabs - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-reverse space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="ml-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tabs - Mobile */}
        <div className="md:hidden mb-6">
          <label htmlFor="tabs" className="sr-only">
            בחר טאב
          </label>
          <select
            id="tabs"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabType)}
            className="block w-full rounded-md border-gray-300 py-2 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.icon} {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'my-ads' && <MyAdsTab />}
          {activeTab === 'favorites' && <FavoritesTab />}
          {activeTab === 'personal' && <PersonalDetailsTab />}
          {activeTab === 'appointments' && <AppointmentsTab />}
          {activeTab === 'communication' && <CommunicationPrefsTab />}
          {activeTab === 'account' && <AccountTab />}
        </div>
      </div>
    </div>
  );
}
