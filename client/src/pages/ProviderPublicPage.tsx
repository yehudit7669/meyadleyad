import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { serviceProviderService } from '../services/api';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const ProviderPublicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const { data: provider, isLoading, error } = useQuery({
    queryKey: ['provider-public', id],
    queryFn: () => serviceProviderService.getPublicProfile(id!),
    enabled: !!id,
  });

  // Debug log when provider data is loaded
  React.useEffect(() => {
    if (provider) {
      console.log('🔍 Client - Received Provider Data:', {
        hasAboutBusiness: !!provider.aboutBusiness,
        aboutBusiness: provider.aboutBusiness,
        hasBusinessAddress: !!provider.businessAddress,
        businessAddress: provider.businessAddress,
        publishOfficeAddress: provider.publishOfficeAddress,
        hasLogoUrl: !!provider.logoUrl,
        businessPhone: provider.businessPhone,
      });
    }
  }, [provider]);

  const validateForm = () => {
    const newErrors: { name?: string; phone?: string; email?: string } = {};
    
    // Name validation
    if (!contactForm.name.trim()) {
      newErrors.name = 'שם חובה';
    } else if (contactForm.name.trim().length < 2) {
      newErrors.name = 'שם חייב להכיל לפחות 2 תווים';
    }
    
    // Phone validation
    if (!contactForm.phone.trim()) {
      newErrors.phone = 'טלפון חובה';
    } else {
      const phoneDigits = contactForm.phone.replace(/\D/g, '');
      if (phoneDigits.length < 9 || phoneDigits.length > 10) {
        newErrors.phone = 'מספר טלפון לא תקין (נדרשים 9-10 ספרות)';
      }
    }
    
    // Email validation
    if (!contactForm.email.trim()) {
      newErrors.email = 'כתובת מייל חובה';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      newErrors.email = 'כתובת מייל לא תקינה';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.post(`/service-providers/contact/${id}`, contactForm);
      toast.success('הפניה נשלחה בהצלחה! נותן השירות יצור איתך קשר בהקדם');
      // Clear form and errors
      setContactForm({
        name: '',
        phone: '',
        email: '',
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error sending contact request:', error);
      
      // Handle validation errors from server
      if (error.response?.status === 400 && error.response?.data?.message) {
        try {
          const serverErrors = JSON.parse(error.response.data.message);
          const newErrors: { name?: string; phone?: string; email?: string } = {};
          
          serverErrors.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              const field = err.path[0];
              newErrors[field as keyof typeof newErrors] = err.message;
            }
          });
          
          if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
          }
        } catch (e) {
          // Not a JSON validation error
        }
      }
      
      toast.error(error.response?.data?.message || 'שגיאה בשליחת הפניה. אנא נסה שוב');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">נותן השירות לא נמצא</p>
          <a href="/" className="text-blue-600 hover:underline">חזרה לדף הבית</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Provider Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Right Column - Provider Info */}
            <div className="flex flex-col items-start text-right space-y-4 pr-8">
              {/* Logo */}
              {provider.logoUrl && (
                <div className="mb-4 self-center w-full flex justify-center">
                  <img
                    src={provider.logoUrl}
                    alt={provider.name}
                    className="max-w-[200px] max-h-[200px] object-contain"
                  />
                </div>
              )}

              {/* Business Name */}
              <h1 className="text-[45px] font-bold leading-tight" style={{ color: '#c89b4c' }}>
                {provider.name}
              </h1>

              {/* Service Type */}
              {provider.serviceProviderType && (
                <div className="text-2xl font-semibold" style={{ color: '#3f504f' }}>
                  {getServiceTypeLabel(provider.serviceProviderType)}
                </div>
              )}

              {/* Phone with Background */}
              {provider.businessPhone && (
                <a 
                  href={`tel:${provider.businessPhone}`} 
                  className="text-white px-6 py-1.5 text-xl font-bold inline-block"
                  style={{ backgroundColor: '#c89b4c', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)' }}
                >
                  {provider.businessPhone}
                </a>
              )}

              {/* Office Address */}
              {provider.businessAddress && (
                <div className="text-lg font-semibold" style={{ color: '#3f504f' }}>
                  {provider.businessAddress}
                </div>
              )}

              {/* Contact Text */}
              <p className="text-lg underline font-bold" style={{ color: '#3f504f' }}>
                צרו קשר לייעוץ ראשוני
              </p>

              {/* About Section */}
              {provider.aboutBusiness && (
                <div className="w-full text-right">
                  <h2 className="text-lg font-semibold underline mb-3" style={{ color: '#3f504f' }}>
                    אודות
                  </h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {provider.aboutBusiness}
                  </p>
                </div>
              )}
            </div>

            {/* Left Column - Contact Form */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-sm">
                <div className="rounded-lg p-6 pb-12" style={{ backgroundColor: '#fff7ed' }}>
                  <h2 className="text-3xl font-bold text-center mb-6" style={{ color: '#223d3c' }}>
                    בואו נדבר
                  </h2>

                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div>
                      <input
                        type="text"
                        placeholder="שם מלא"
                        value={contactForm.name}
                        onChange={(e) => {
                          setContactForm({ ...contactForm, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: undefined });
                        }}
                        className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c89b4c] focus:border-transparent text-right placeholder:text-gray-400 ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        style={{ color: '#223d3c' }}
                        required
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1 text-right">{errors.name}</p>
                      )}
                    </div>

                    {/* Phone Field */}
                    <div>
                      <input
                        type="tel"
                        placeholder="טלפון"
                        value={contactForm.phone}
                        onChange={(e) => {
                          setContactForm({ ...contactForm, phone: e.target.value });
                          if (errors.phone) setErrors({ ...errors, phone: undefined });
                        }}
                        className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c89b4c] focus:border-transparent text-right placeholder:text-gray-400 ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        style={{ color: '#223d3c' }}
                        dir="rtl"
                        required
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1 text-right">{errors.phone}</p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div>
                      <input
                        type="email"
                        placeholder="כתובת מייל"
                        value={contactForm.email}
                        onChange={(e) => {
                          setContactForm({ ...contactForm, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c89b4c] focus:border-transparent text-right placeholder:text-gray-400 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        style={{ color: '#223d3c' }}
                        required
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1 text-right">{errors.email}</p>
                      )}
                    </div>
                  </form>
                </div>
                
                {/* Submit Button - Positioned at the bottom center */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    onClick={handleContactSubmit}
                    disabled={isSubmitting}
                    className="relative -mt-6 px-16 py-2 rounded-full text-2xl font-bold hover:opacity-90 transition-opacity border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#c89b4c', color: '#223d3c' }}
                  >
                    {isSubmitting ? 'שולח...' : 'צרו קשר'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderPublicPage;
