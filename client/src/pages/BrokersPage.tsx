import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import BrokerCardCompact from '../components/providers/BrokerCardCompact';
import { usersService, citiesService } from '../services/api';

const BrokersPage = () => {
  const [selectedCityId, setSelectedCityId] = useState<string>('');

  // Fetch cities for filter
  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: citiesService.getCities,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch brokers with city filter
  const { data: brokers, isLoading } = useQuery({
    queryKey: ['brokers', selectedCityId],
    queryFn: () => usersService.getBrokers(selectedCityId || undefined),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md animate-pulse"
              style={{ height: '280px' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!brokers || brokers.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">אין מתווכים להצגה</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Assistant, sans-serif' }}>
            סינון לפי עיר:
          </label>
          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ fontFamily: 'Assistant, sans-serif' }}
          >
            <option value="">כל הערים</option>
            {cities?.map((city: any) => (
              <option key={city.id} value={city.id}>
                {city.nameHe}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {brokers.map((broker: any) => (
          <BrokerCardCompact key={broker.id} broker={broker} />
        ))}
      </div>
    </div>
  );
};

export default BrokersPage;
