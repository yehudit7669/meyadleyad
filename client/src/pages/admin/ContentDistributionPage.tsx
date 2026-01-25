import { useState } from 'react';
import { FileText, Mail, BarChart3 } from 'lucide-react';
import ContentTab from '../../components/admin/content-distribution/ContentTab';
import MailingTab from '../../components/admin/content-distribution/MailingTab';
import StatsTab from '../../components/admin/content-distribution/StatsTab';

type TabType = 'content' | 'mailing' | 'stats';

export default function ContentDistributionPage() {
  const [activeTab, setActiveTab] = useState<TabType>('content');

  const tabs = [
    { id: 'content' as TabType, label: 'תוכן', icon: FileText },
    { id: 'mailing' as TabType, label: 'תפוצה', icon: Mail },
    { id: 'stats' as TabType, label: 'סטטיסטיקה', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">ניהול תוכן / תפוצה</h1>
        <p className="text-gray-600 mt-2">ניהול תוכן לתפוצה, רשימת דיוור וסטטיסטיקות</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'content' && <ContentTab />}
          {activeTab === 'mailing' && <MailingTab />}
          {activeTab === 'stats' && <StatsTab />}
        </div>
      </div>
    </div>
  );
}
