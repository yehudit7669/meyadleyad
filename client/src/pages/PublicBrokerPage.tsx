import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface PublicBrokerData {
  broker: {
    id: string;
    name: string;
    email: string;
    businessName?: string;
    businessPhone?: string;
    about?: string;
    logoUrl?: string;
  };
  ads: Array<{
    id: string;
    title: string;
    adNumber: number;
    Category?: { nameHe: string };
    City?: { nameHe: string };
    AdImage?: Array<{ url: string }>;
  }>;
}

const PublicBrokerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<PublicBrokerData>({
    queryKey: ['public-broker', id],
    queryFn: async () => {
      const response = await api.get(`/broker/public/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">מתווך לא נמצא</p>
          <a href="/" className="text-blue-600 hover:underline">חזרה לדף הבית</a>
        </div>
      </div>
    );
  }

  const { broker, ads } = data;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Broker Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-start gap-6">
            {broker.logoUrl ? (
              <img
                src={broker.logoUrl}
                alt={broker.businessName || broker.name}
                className="w-32 h-32 object-contain border rounded-lg"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-4xl">🏢</span>
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {broker.businessName || broker.name}
              </h1>
              
              {broker.about && (
                <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                  {broker.about}
                </p>
              )}

              <div className="space-y-2 text-gray-700">
                {broker.businessPhone && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${broker.businessPhone}`} className="hover:text-blue-600">
                      {broker.businessPhone}
                    </a>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${broker.email}`} className="hover:text-blue-600">
                    {broker.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ads Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            מודעות פעילות ({ads.length})
          </h2>

          {ads.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500">אין מודעות פעילות כרגע</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad) => (
                <a
                  key={ad.id}
                  href={`/ads/${ad.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  {ad.AdImage && ad.AdImage[0] && (
                    <img
                      src={ad.AdImage[0].url}
                      alt={ad.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                      {ad.title}
                    </h3>
                    
                    <div className="text-sm text-gray-500 space-x-2 space-x-reverse">
                      <span>#{ad.adNumber}</span>
                      {ad.Category && <span>• {ad.Category.nameHe}</span>}
                      {ad.City && <span>• {ad.City.nameHe}</span>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicBrokerPage;
