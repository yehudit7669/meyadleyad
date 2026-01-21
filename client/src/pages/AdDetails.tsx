import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adsService } from '../services/api';
import { useState, useEffect } from 'react';
import { useAnalytics } from '../utils/analytics';
import { formatCustomFields } from '../utils/fieldLabels';
import SEO from '../components/SEO';
import AdMap from '../components/AdMap';
import AppointmentCard from '../components/appointments/AppointmentCard';
import { getImageUrl } from '../utils/imageUrl';

export default function AdDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { trackAdView, trackContactClick } = useAnalytics();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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
        <div className="container mx-auto px-4 py-8">
          {/* 3 Column Layout - Desktop / Single Column - Mobile */}
          <div className="flex flex-col md:flex-row gap-6 lg:gap-10 w-full">
            
            {/* RIGHT COLUMN - Property Details (30%) */}
            <div className="w-full md:w-[30%] flex flex-col gap-4 order-2 md:order-1">
              {/* Price and Basic Info */}
              <div className="bg-white rounded-lg p-6 shadow-md text-right">
                {ad.price && (
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-[#C9A24D]">
                      ₪{ad.price.toLocaleString()}
                    </div>
                  </div>
                )}

                <div className="space-y-3 text-[#1F3F3A]">
                  <h1 className="text-2xl font-bold">{ad.title}</h1>
                  
                  {/* Location - either address or requestedLocationText for wanted ads */}
                  {(ad.address || ad.requestedLocationText) && (
                    <div className="flex items-center gap-2 text-lg">
                      <span>📍</span>
                      <span>
                        {ad.isWanted && ad.requestedLocationText
                          ? `אזור מבוקש: ${ad.requestedLocationText}`
                          : ad.address && ad.city?.nameHe
                          ? `${ad.address}, ${ad.city.nameHe}`
                          : ad.address || ad.requestedLocationText
                        }
                      </span>
                    </div>
                  )}

                  {/* Custom Fields */}
                  {ad.customFields && Object.keys(ad.customFields).length > 0 && (
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                      {formatCustomFields(ad.customFields as Record<string, any>).map(({ label, value }, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="font-semibold">{label}:</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg p-6 shadow-md text-right">
                <h2 className="font-bold text-xl mb-4 text-[#1F3F3A]">תיאור הנכס:</h2>
                <p className="text-[#3A3A3A] leading-relaxed whitespace-pre-wrap">{ad.description}</p>
              </div>

              {/* Features Grid */}
              {ad.customFields && (ad.customFields as any).features && (
                <div className="bg-white rounded-lg p-6 shadow-md text-right">
                  <h2 className="font-bold text-xl mb-4 text-[#1F3F3A]">מה בנכס:</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Holiday Rent Features (Shabbat Apartments) */}
                    {(ad.customFields as any).features.plata && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">🔥</div>
                        <span className="text-sm text-center text-[#1F3F3A]">פלטה</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.urn && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">☕</div>
                        <span className="text-sm text-center text-[#1F3F3A]">מיחם</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.linens && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">🛏️</div>
                        <span className="text-sm text-center text-[#1F3F3A]">מצעים</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.pool && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">🏊</div>
                        <span className="text-sm text-center text-[#1F3F3A]">בריכה</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.kidsGames && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">🎮</div>
                        <span className="text-sm text-center text-[#1F3F3A]">משחקי ילדים</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.babyBed && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">👶</div>
                        <span className="text-sm text-center text-[#1F3F3A]">מיטת תינוק</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.masterUnit && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">🚪</div>
                        <span className="text-sm text-center text-[#1F3F3A]">יחידת הורים</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.sleepingOnly && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">😴</div>
                        <span className="text-sm text-center text-[#1F3F3A]">לינה בלבד</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.balcony && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">🏡</div>
                        <span className="text-sm text-center text-[#1F3F3A]">מרפסת</span>
                      </div>
                    )}
                    
                    {/* Regular Apartment Features */}
                    {(ad.customFields as any).features.parking && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">
                          🅿️
                        </div>
                        <span className="text-sm text-center text-[#1F3F3A]">חניה</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.storage && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">
                          📦
                        </div>
                        <span className="text-sm text-center text-[#1F3F3A]">מחסן</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.safeRoom && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">
                          🛡️
                        </div>
                        <span className="text-sm text-center text-[#1F3F3A]">ממ״ד</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.sukkaBalcony && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">
                          🏡
                        </div>
                        <span className="text-sm text-center text-[#1F3F3A]">מרפסת סוכה</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.elevator && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">
                          🛗
                        </div>
                        <span className="text-sm text-center text-[#1F3F3A]">מעלית</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.view && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">
                          🏞️
                        </div>
                        <span className="text-sm text-center text-[#1F3F3A]">נוף</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.parentalUnit && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">
                          🚪
                        </div>
                        <span className="text-sm text-center text-[#1F3F3A]">יחידת הורים</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.housingUnit && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">
                          🏠
                        </div>
                        <span className="text-sm text-center text-[#1F3F3A]">יחידת דיור</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.yard && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">
                          🌳
                        </div>
                        <span className="text-sm text-center text-[#1F3F3A]">חצר</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.ac && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">
                          ❄️
                        </div>
                        <span className="text-sm text-center text-[#1F3F3A]">מיזוג</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.airConditioning && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">
                          ❄️
                        </div>
                        <span className="text-sm text-center text-[#1F3F3A]">מיזוג</span>
                      </div>
                    )}
                    {(ad.customFields as any).features.hasOption && ad.category?.slug === 'apartments-for-sale' && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl text-[#C9A24D]">
                          ✅
                        </div>
                        <span className="text-sm text-center text-[#1F3F3A]">אופציה</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Bar */}
              <div className="bg-[#C9A24D] rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="text-[#1F3F3A] text-right">
                    <div className="font-bold text-xl mb-1">תיווך - {ad.user?.name || ad.user?.email || 'משתמש'}</div>
                    {ad.user.phone && (
                      <div className="flex items-center gap-2 text-lg">
                        <span>☎️</span>
                        <a
                          href={`tel:${ad.user.phone}`}
                          onClick={() => handleContactClick('phone')}
                          className="font-semibold hover:underline"
                        >
                          {ad.user.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {ad.user.phone && (
                      <>
                        <a
                          href={`tel:${ad.user.phone}`}
                          onClick={() => handleContactClick('phone')}
                          className="bg-[#1F3F3A] text-[#C9A24D] p-3 rounded-full hover:bg-[#2d5a52] transition"
                          aria-label="התקשר בטלפון"
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                        </a>
                        <a
                          href={`https://wa.me/${ad.user.phone?.replace(/[^0-9]/g, '')}`}
                          onClick={() => handleContactClick('whatsapp')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#25D366] text-white p-3 rounded-full hover:bg-[#20BA5A] transition"
                          aria-label="שלח הודעה בוואטסאפ"
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Appointment Card */}
              <AppointmentCard adId={ad.id} adOwnerId={ad.userId} />
            </div>

            {/* CENTER COLUMN - Images (40%) */}
            <div className="w-full md:w-[40%] flex flex-col items-center gap-6 order-1 md:order-2">
              {/* Map Pin with Main Image */}
              <div className="flex flex-col items-center">
                {/* Map Pin Container */}
                <div className="relative">
                  {/* Map Pin Shape */}
                  <div className="relative w-80 h-80 sm:w-96 sm:h-96">
                    {/* Pin Circle */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-72 h-72 sm:w-80 sm:h-80 rounded-full border-[6px] border-[#8B5A3C] overflow-hidden bg-white">
                      {ad.images && ad.images.length > 0 ? (
                        <img
                          src={getImageUrl(ad.images[currentImageIndex].url)}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xl">אין תמונה</span>
                        </div>
                      )}
                    </div>
                    {/* Pin Pointer */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[40px] border-t-[#8B5A3C]"></div>
                  </div>
                </div>

                {/* Logo/Title Above Pin */}
                <div className="text-center mb-4 -mt-4">
                  <span className="text-2xl font-bold text-[#8B5A3C]">מקן-מי</span>
                </div>

                {/* Gallery Thumbnails */}
                {ad.images && ad.images.length > 1 && (
                  <div className="flex gap-4 mt-6 justify-center flex-wrap">
                    {ad.images.slice(0, 5).map((image: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        aria-label={`עבור לתמונה ${index + 1}`}
                        aria-current={index === currentImageIndex ? 'true' : 'false'}
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 overflow-hidden transition-all ${
                          index === currentImageIndex
                            ? 'border-[#C9A24D] scale-110'
                            : 'border-[#8B5A3C] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={getImageUrl(image.url)}
                          alt={`תמונה ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* LEFT COLUMN - Map (30%) */}
            <div className="w-full md:w-[30%] order-3">
              <div className="sticky top-24">
                <AdMap
                  address={ad.address}
                  latitude={ad.latitude}
                  longitude={ad.longitude}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
