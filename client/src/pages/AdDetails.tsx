import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adsService } from '../services/api';
import { useState, useEffect } from 'react';
import { useAnalytics } from '../utils/analytics';
import SEO from '../components/SEO';
import AdMap from '../components/AdMap';
import AppointmentCard from '../components/appointments/AppointmentCard';
import { PROPERTY_TYPE_OPTIONS } from '../constants/adTypes';

export default function AdDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { trackAdView, trackContactClick } = useAnalytics();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Helper function to get property type label in Hebrew
  const getPropertyTypeLabel = (propertyType: string): string => {
    const option = PROPERTY_TYPE_OPTIONS.find(opt => opt.value === propertyType);
    return option ? option.label : propertyType;
  };

  // Helper function to build address dynamically
  const getFullAddress = (): string => {
    if (ad.isWanted && ad.requestedLocationText) {
      return `אזור מבוקש: ${ad.requestedLocationText}`;
    }

    const parts: string[] = [];
    
    // Add street name if exists
    if (ad.street?.name) {
      parts.push(ad.street.name);
    }
    
    // Add house number if exists in customFields
    if (ad.customFields?.houseNumber) {
      parts.push(ad.customFields.houseNumber.toString());
    }
    
    // Add neighborhood if no street or as additional info
    if (ad.neighborhood) {
      if (!ad.street?.name) {
        // If no street, show neighborhood prominently
        parts.push(ad.neighborhood);
      }
    }
    
    // Add city name
    if (ad.city?.nameHe) {
      parts.push(ad.city.nameHe);
    }
    
    return parts.length > 0 ? parts.join(', ') : (ad.address || '');
  };

  console.log("✅ AdDetails rendered - New luxury design loaded");

  // Show success message if coming from wizard
  useEffect(() => {
    if (location.state?.message) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const { data: ad, isLoading, error } = useQuery({
    queryKey: ['ad', id],
    queryFn: () => adsService.getAd(id!),
    enabled: !!id,
  });

  // Track ad view
  useEffect(() => {
    if (ad) {
      trackAdView(ad.id, ad.title, ad.category?.nameHe || 'מודעה', ad.price);
    }
  }, [ad, trackAdView]);

  const contactClickMutation = useMutation({
    mutationFn: () => adsService.incrementContactClick(id!),
  });

  const handleContactClick = (type: 'phone' | 'whatsapp' | 'email') => {
    contactClickMutation.mutate();
    trackContactClick(id!, type);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen bg-[#F6F1EC] flex items-center justify-center" dir="rtl">
        <div className="text-center bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-[#1F3F3A] mb-4">המודעה לא נמצאה</h2>
          <Link to="/" className="inline-block bg-[#C9A24D] text-[#1F3F3A] px-6 py-3 rounded-lg font-bold hover:bg-[#B08C3C] transition">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  console.log("🔴 AdPage JSX is rendering - CHECK THIS IN CONSOLE");
  console.log("Ad data:", ad.title);

  return (
    <>
      {/* SEO */}
      <SEO
        title={ad.title}
        description={ad.description.slice(0, 155)}
        image={ad.images?.[0]?.url}
        type="product"
        keywords={[
          ad.category?.nameHe || 'מודעה',
          ad.city?.nameHe || ad.requestedLocationText || 'ישראל',
          'מודעות',
          'קניה ומכירה'
        ].filter(Boolean)}
      />
      
      {/* Success Message */}
      {showSuccessMessage && location.state?.message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-green-500 text-white px-8 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-lg font-bold">{location.state.message}</span>
          </div>
        </div>
      )}
      
      {/* Main Container */}
      <div className="min-h-screen w-full bg-[#F6F1EC]" dir="rtl">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Layout: Main content + Sidebar */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Main Content Area (Right & Center) */}
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Images Section - Thumbnails on right, large image on left */}
              <div className="flex flex-col md:flex-row gap-3">
                {/* Thumbnails - Vertical list on right */}
                {ad.images && ad.images.length > 1 && (
                  <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible md:order-2 md:w-28">
                    {ad.images.map((image: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 md:w-full md:h-16 rounded-2xl overflow-hidden transition-all ${
                          index === currentImageIndex
                            ? 'ring-2 ring-[#C9A24D] scale-105'
                            : 'ring-1 ring-gray-300 hover:ring-[#C9A24D] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${image.url}`}
                          alt={`תמונה ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Main Large Image */}
                <div className="md:order-1">
                  <div className="w-full max-w-xl aspect-[16/9] bg-white rounded-2xl overflow-hidden shadow-md">
                    {ad.images && ad.images.length > 0 ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${ad.images[currentImageIndex].url}`}
                        alt={ad.title}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition"
                        onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${ad.images[currentImageIndex].url}`, '_blank')}
                      />
                    ) : (
                      <img
                        src="/images/default-property.jpg"
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              {ad.price && (
                <div className="text-right">
                  <div className="text-[32px] font-bold text-[#C9A24D]">
                    ₪{ad.price.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Address */}
              {getFullAddress() && (
                <div className="text-right">
                  <div className="text-xl text-gray-900 font-bold mb-3">
                    {getFullAddress()}
                  </div>
                </div>
              )}

              {/* Property Details Line */}
              <div className="text-right">
                <div className="flex items-center gap-2 text-base text-gray-600 flex-wrap">
                  {ad.customFields?.propertyType && (
                    <span className="font-medium">{getPropertyTypeLabel(ad.customFields.propertyType)}</span>
                  )}
                  {ad.customFields?.rooms && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span>{ad.customFields.rooms} חדרים</span>
                    </>
                  )}
                  {ad.customFields?.squareMeters && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span>{ad.customFields.squareMeters} מ"ר</span>
                    </>
                  )}
                  {ad.customFields?.floor !== null && ad.customFields?.floor !== undefined && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span>קומה {ad.customFields.floor}</span>
                    </>
                  )}
                  {ad.customFields?.condition && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span>{ad.customFields.condition}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Description and Features - Side by side */}
              <div className="flex flex-col md:flex-row gap-3 max-w-xl">
                {/* Description - Right side */}
                <div className="w-full md:w-[50%]">
                  <h2 className="font-bold text-xl mb-4 text-[#C9A24D]">תיאור הנכס</h2>
                  <p className="text-[#3A3A3A] leading-relaxed whitespace-pre-wrap text-base">{ad.description}</p>
                </div>

                {/* Divider - visible only on desktop */}
                <div className="hidden md:block w-px bg-gray-300"></div>

                {/* Features - Left side with icons */}
                <div className="flex-1">
                  <h2 className="font-bold text-xl mb-4 text-[#C9A24D]">מה בנכס</h2>

                  {/* Features Grid with Icons */}
                  {ad.customFields && (ad.customFields as any).features && (
                    <div className="grid grid-cols-3 gap-1">
                      {/* Holiday Rent Features */}
                      {(ad.customFields as any).features.plata && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🔥</div>
                          <span className="text-xs text-[#1F3F3A]">פלטה</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.urn && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">☕</div>
                          <span className="text-xs text-[#1F3F3A]">מיחם</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.linens && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🛏️</div>
                          <span className="text-xs text-[#1F3F3A]">מצעים</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.pool && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🏊</div>
                          <span className="text-xs text-[#1F3F3A]">בריכה</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.kidsGames && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🎮</div>
                          <span className="text-xs text-[#1F3F3A]">משחקי ילדים</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.babyBed && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">👶</div>
                          <span className="text-xs text-[#1F3F3A]">מיטת תינוק</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.parking && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🅿️</div>
                          <span className="text-xs text-[#1F3F3A]">חניה</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.storage && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">📦</div>
                          <span className="text-xs text-[#1F3F3A]">מחסן</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.safeRoom && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🛡️</div>
                          <span className="text-xs text-[#1F3F3A]">ממ״ד</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.sukkaBalcony && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🏡</div>
                          <span className="text-xs text-[#1F3F3A]">מרפסת סוכה</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.elevator && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🛗</div>
                          <span className="text-xs text-[#1F3F3A]">מעלית</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.view && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🏞️</div>
                          <span className="text-xs text-[#1F3F3A]">נוף</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.parentalUnit && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🚪</div>
                          <span className="text-xs text-[#1F3F3A]">יחידת הורים</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.housingUnit && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🏠</div>
                          <span className="text-xs text-[#1F3F3A]">יחידת דיור</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.yard && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🌳</div>
                          <span className="text-xs text-[#1F3F3A]">חצר</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.garden && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🌻</div>
                          <span className="text-xs text-[#1F3F3A]">גינה</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.frontFacing && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🏢</div>
                          <span className="text-xs text-[#1F3F3A]">חזית</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.upgradedKitchen && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">👨‍🍳</div>
                          <span className="text-xs text-[#1F3F3A]">מטבח משודרג</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.accessibleForDisabled && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">♿</div>
                          <span className="text-xs text-[#1F3F3A]">נגיש לנכים</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.ac && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">❄️</div>
                          <span className="text-xs text-[#1F3F3A]">מיזוג</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.airConditioning && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">❄️</div>
                          <span className="text-xs text-[#1F3F3A]">מיזוג</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.balcony && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🏡</div>
                          <span className="text-xs text-[#1F3F3A]">מרפסת</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.masterUnit && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">🚪</div>
                          <span className="text-xs text-[#1F3F3A]">יחידת הורים</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.sleepingOnly && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">😴</div>
                          <span className="text-xs text-[#1F3F3A]">לינה בלבד</span>
                        </div>
                      )}
                      {(ad.customFields as any).features.hasOption && ad.category?.slug === 'apartments-for-sale' && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-2xl text-[#C9A24D]">✅</div>
                          <span className="text-xs text-[#1F3F3A]">אופציה</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Left Sidebar - Map and Contact */}
            <div className="lg:w-96 flex flex-col gap-6">
              {/* Map */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="aspect-square">
                  <AdMap
                    address={ad.address}
                    latitude={ad.latitude}
                    longitude={ad.longitude}
                  />
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-[#C9A24D] rounded-lg p-4 shadow-md">
                <div className="space-y-3">
                  <div className="text-[#1F3F3A] text-center">
                    <div className="font-bold text-lg mb-2">
                      {ad.customFields?.contactName || (ad.user?.role === 'BROKER' ? `תיווך - ${ad.user?.name || ad.user?.email || 'משתמש'}` : ad.user?.name || ad.user?.email || 'משתמש')}
                    </div>
                    {(ad.customFields?.contactPhone || ad.user.phone) && (
                      <div className="flex items-center justify-center gap-2 text-base">
                        <span>☎️</span>
                        <a
                          href={`tel:${ad.customFields?.contactPhone || ad.user.phone}`}
                          onClick={() => handleContactClick('phone')}
                          className="font-semibold hover:underline"
                        >
                          {ad.customFields?.contactPhone || ad.user.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  {(ad.customFields?.contactPhone || ad.user.phone) && (
                    <div className="flex gap-3">
                      <a
                        href={`tel:${ad.customFields?.contactPhone || ad.user.phone}`}
                        onClick={() => handleContactClick('phone')}
                        className="flex-1 bg-[#1F3F3A] text-white py-2 rounded-lg hover:bg-[#2d5a52] transition text-center font-bold text-sm"
                      >
                        📞 התקשר
                      </a>
                      <a
                        href={`https://wa.me/${(ad.customFields?.contactPhone || ad.user.phone)?.replace(/[^0-9]/g, '')}`}
                        onClick={() => handleContactClick('whatsapp')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#25D366] text-white py-2 rounded-lg hover:bg-[#20BA5A] transition text-center font-bold text-sm"
                      >
                        💬 וואטסאפ
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Card */}
              <AppointmentCard adId={ad.id} adOwnerId={ad.userId} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
