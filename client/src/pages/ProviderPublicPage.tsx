import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { serviceProviderService } from '../services/api';
import { BusinessHours } from '../types';

const ProviderPublicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: provider, isLoading, error } = useQuery({
    queryKey: ['provider-public', id],
    queryFn: () => serviceProviderService.getPublicProfile(id!),
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

  if (error || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">נותן השירות לא נמצא</h2>
          <Link to="/" className="text-blue-600 hover:underline">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  // Debug logs for office address
  console.log('🔍 Provider Data:', {
    publishOfficeAddress: provider.publishOfficeAddress,
    officeAddress: provider.officeAddress,
    shouldShowAddress: provider.publishOfficeAddress && provider.officeAddress,
  });

  const renderBusinessHours = () => {
    if (!provider.businessHours) return null;

    const hours = provider.businessHours as BusinessHours;
    const daysMap: Record<string, string> = {
      sun: 'ראשון',
      mon: 'שני',
      tue: 'שלישי',
      wed: 'רביעי',
      thu: 'חמישי',
      fri: 'שישי',
    };

    return (
      <div className="space-y-2">
        {Object.entries(daysMap).map(([key, label]) => {
          const dayHours = hours[key as keyof BusinessHours];
          if (!dayHours || dayHours.length === 0) {
            return (
              <div key={key} className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-gray-500">סגור</span>
              </div>
            );
          }

          return (
            <div key={key} className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{label}</span>
              <span className="text-gray-900">
                {dayHours.map((range, i) => (
                  <span key={i}>
                    {range.from} - {range.to}
                    {i < dayHours.length - 1 && ', '}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const getServiceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      LAWYER: 'עורך דין',
      APPRAISER: 'שמאי',
      DESIGNER_ARCHITECT: 'מעצב פנים / אדריכל',
      MORTGAGE_ADVISOR: 'יועץ משכנתאות',
      BROKER: 'מתווך',
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start gap-6">
            {provider.logoUrl && (
              <img
                src={provider.logoUrl}
                alt="Logo"
                className="w-32 h-32 object-contain border rounded-lg p-2"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{provider.name}</h1>
              {provider.serviceProviderType && (
                <p className="text-lg text-blue-600 mb-4">
                  {getServiceTypeLabel(provider.serviceProviderType)}
                </p>
              )}
              
              {/* Contact Buttons */}
              <div className="flex flex-wrap gap-3">
                {provider.phoneBusinessOffice && (
                  <>
                    <a
                      href={`tel:${provider.phoneBusinessOffice}`}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      📞 התקשר
                    </a>
                    <a
                      href={`https://wa.me/${provider.phoneBusinessOffice.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#20BA5A] transition"
                    >
                      💬 WhatsApp
                    </a>
                  </>
                )}
                {provider.email && (
                  <a
                    href={`mailto:${provider.email}`}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition"
                  >
                    📧 שלח מייל
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        {provider.aboutBusiness && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">אודות</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{provider.aboutBusiness}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Hours */}
          {provider.businessHours && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">שעות פעילות</h2>
              {renderBusinessHours()}
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">יצירת קשר</h2>
            <div className="space-y-2">
              {provider.phoneBusinessOffice && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">📞 טלפון:</span>
                  <a href={`tel:${provider.phoneBusinessOffice}`} className="text-blue-600 hover:underline">
                    {provider.phoneBusinessOffice}
                  </a>
                </div>
              )}
              {provider.email && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">📧 אימייל:</span>
                  <a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline">
                    {provider.email}
                  </a>
                </div>
              )}
              {provider.publishOfficeAddress && provider.officeAddress && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">📍 כתובת:</span>
                  <span className="text-gray-900">{provider.officeAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-block bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProviderPublicPage;
