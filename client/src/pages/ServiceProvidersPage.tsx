import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '../services/api';
import ServiceProviderCardCompact from '../components/providers/ServiceProviderCardCompact';

// תרגום סוגי נותני שירות
const providerTypeLabels: Record<string, string> = {
  LAWYER: 'עורך דין',
  APPRAISER: 'שמאי',
  DESIGNER_ARCHITECT: 'מעצב/אדריכל',
  MORTGAGE_ADVISOR: 'יועץ משכנתאות',
};

export default function ServiceProvidersPage() {
  const [searchParams] = useSearchParams();
  const [selectedProviderType, setSelectedProviderType] = useState<string>('');
  
  // Get cities from URL params
  const citiesParam = searchParams.get('cities');
  const selectedCities = citiesParam ? citiesParam.split(',') : [];
  const cityId = selectedCities.length === 1 ? selectedCities[0] : undefined;

  // Fetch service providers
  const { data: serviceProviders, isLoading } = useQuery({
    queryKey: ['service-providers', cityId],
    queryFn: () => usersService.getServiceProviders(cityId),
  });

  // Filter by provider type
  const filteredProviders = serviceProviders?.filter((provider: any) => {
    if (!selectedProviderType) return true;
    return provider.serviceProviderType === selectedProviderType;
  }) || [];

  const providersList = filteredProviders;

  return (
    <div className="min-h-screen bg-white py-8" dir="rtl">
      <div className="container mx-auto px-4">
        {/* Filter */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Assistant, sans-serif' }}>
              סינון לפי סוג נותן שירות:
            </label>
            <select
              value={selectedProviderType}
              onChange={(e) => setSelectedProviderType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ fontFamily: 'Assistant, sans-serif' }}
            >
              <option value="">כל נותני השירות</option>
              {Object.entries(providerTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          // Loading skeletons
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-lg animate-pulse"
                style={{ height: '280px' }}
              />
            ))}
          </div>
        ) : providersList.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            לא נמצאו נותני שירות
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {providersList.map((provider: any) => (
              <ServiceProviderCardCompact key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
