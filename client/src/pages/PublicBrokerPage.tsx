import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import AdCardCompact from '../components/home/AdCardCompact';

interface PublicBrokerData {
  broker: {
    id: string;
    name: string;
    email: string;
    businessName?: string;
    businessPhone?: string;
    businessAddress?: string;
    about?: string;
    logoUrl?: string;
  };
  ads: Array<{
    id: string;
    title: string;
    adNumber: number;
    description?: string;
    price?: number;
    views?: number;
    createdAt: string;
    address?: string;
    customFields?: any;
    Category?: { nameHe: string };
    City?: { nameHe: string };
    AdImage?: Array<{ url: string }>;
    isWanted?: boolean;
    requestedLocationText?: string;
    user?: {
      email: string;
      name?: string;
    };
  }>;
}

const PublicBrokerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const { data, isLoading, error } = useQuery<PublicBrokerData>({
    queryKey: ['public-broker', id],
    queryFn: async () => {
      const response = await api.get(`/broker/public/${id}`);
      return response.data as PublicBrokerData;
    },
    enabled: !!id,
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // כאן ניתן להוסיף לוגיקה לשליחת הטופס
    console.log('Contact form submitted:', contactForm);
  };

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

  const broker = data.broker;
  const ads = data.ads || [];

  return (
    <div className="min-h-screen bg-white" dir="rtl" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Broker Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Right Column - Broker Info */}
            <div className="flex flex-col items-start text-right space-y-4 pr-8">
              {/* Logo */}
              {broker.logoUrl && (
                <div className="mb-4 self-center w-full flex justify-center">
                  <img
                    src={broker.logoUrl}
                    alt={broker.businessName || broker.name}
                    className="max-w-[200px] max-h-[200px] object-contain"
                  />
                </div>
              )}

              {/* Business Name */}
              <h1 className="text-[45px] font-bold leading-tight" style={{ color: '#c89b4c' }}>
                {broker.businessName || broker.name}
              </h1>

              {/* Phone with Background */}
              {broker.businessPhone && (
                <a 
                  href={`tel:${broker.businessPhone}`} 
                  className="text-white px-6 py-1.5 text-xl font-bold inline-block"
                  style={{ backgroundColor: '#c89b4c', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)' }}
                >
                  {broker.businessPhone}
                </a>
              )}

              {/* Contact Text */}
              <p className="text-lg underline font-bold" style={{ color: '#3f504f' }}>
                צרו קשר לייעוץ ראשוני
              </p>

              {/* About Section */}
              {broker.about && (
                <div className="w-full text-right">
                  <h2 className="text-lg font-semibold underline mb-3" style={{ color: '#3f504f' }}>
                    אודות
                  </h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {broker.about}
                  </p>
                </div>
              )}
            </div>

            {/* Left Column - Contact Form */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-sm">
                <div className="rounded-lg p-6 pb-12" style={{ backgroundColor: '#fff7ed' }}>
                  <h2 className="text-3xl font-bold text-center mb-6" style={{ color: '#223d3c' }}>
                    בואו נדבר נדל"ן
                  </h2>

                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div>
                      <input
                        type="text"
                        placeholder="שם מלא"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c89b4c] focus:border-transparent text-right"
                        required
                      />
                    </div>

                    {/* Phone Field */}
                    <div>
                      <input
                        type="tel"
                        placeholder="טלפון"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c89b4c] focus:border-transparent text-right"
                        dir="rtl"
                        required
                      />
                    </div>

                    {/* Email Field */}
                    <div>
                      <input
                        type="email"
                        placeholder="כתובת מייל"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c89b4c] focus:border-transparent text-right"
                        required
                      />
                    </div>
                  </form>
                </div>
                
                {/* Submit Button - Positioned at the bottom center */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    onClick={handleContactSubmit}
                    className="relative -mt-6 px-16 py-2 rounded-full text-2xl font-bold hover:opacity-90 transition-opacity border-2 border-black"
                    style={{ backgroundColor: '#c89b4c', color: '#223d3c' }}
                  >
                    צרו קשר
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ads Section */}
        <div className="bg-[#f8f3f2] w-full py-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#c89b4c' }}>
              נבחרת הנכסים:
            </h2>

            {ads.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500">אין מודעות פעילות כרגע</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {ads.map((ad: any) => (
                  <AdCardCompact
                    key={ad.id}
                    ad={{
                      id: ad.id,
                      title: ad.title,
                      price: ad.price,
                      images: ad.AdImage,
                      category: ad.Category || { nameHe: 'מודעה' },
                      city: ad.City,
                      address: ad.address,
                      customFields: ad.customFields,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBrokerPage;
