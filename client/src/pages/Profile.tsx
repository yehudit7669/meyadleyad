import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { isBroker, isServiceProvider } from '../utils/userHelpers';
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
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  // Redirect brokers to broker profile
  useEffect(() => {
    if (authUser?.role === 'BROKER' || isBroker(authUser)) {
      console.log('🔄 REDIRECTING BROKER TO BROKER PROFILE');
      navigate('/broker/my-profile', { replace: true });
    } else if (isServiceProvider(authUser)) {
      console.log('🔄 REDIRECTING SERVICE PROVIDER TO SERVICE PROVIDER PROFILE');
      navigate('/service-provider/my-profile', { replace: true });
    }
  }, [authUser, navigate]);

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

        {/* Tabs - Scrollable on Mobile/Tablet */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav 
              className="flex space-x-reverse space-x-8 px-6 overflow-x-auto scrollbar-hide" 
              aria-label="Tabs"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0
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
