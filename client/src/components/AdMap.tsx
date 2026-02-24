import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import { useMemo } from 'react';

interface AdMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
  disableDefaultUI: false,
  clickableIcons: false,
  scrollwheel: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export default function AdMap({ latitude, longitude, address }: AdMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
  });

  // Memoize map center to avoid re-renders
  const center = useMemo(() => {
    if (latitude && longitude) {
      return { lat: latitude, lng: longitude };
    }
    // Default to Israel center if no coordinates
    return { lat: 31.7683, lng: 35.2137 };
  }, [latitude, longitude]);

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A24D] mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">טוען מפה...</p>
        </div>
      </div>
    );
  }

  // Show error if API key is missing
  if (!apiKey || apiKey === 'your-google-maps-api-key') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-gray-600 font-medium mb-1">מפה לא זמינה</p>
          <p className="text-gray-500 text-sm">נא להגדיר Google Maps API Key</p>
        </div>
      </div>
    );
  }

  // Show error if loading failed
  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 p-4">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium mb-1">שגיאה בטעינת המפה</p>
          <p className="text-red-500 text-sm">אנא נסה שוב מאוחר יותר</p>
        </div>
      </div>
    );
  }

  // Show message if no coordinates
  if (!latitude || !longitude) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-600 font-medium mb-1">מיקום לא זמין</p>
          <p className="text-gray-500 text-sm">
            {address || 'לא הוזן מיקום מדויק לנכס זה'}
          </p>
        </div>
      </div>
    );
  }

  // Render the map with marker
  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={16}
      options={mapOptions}
    >
      <Marker
        position={center}
        title={address || 'מיקום הנכס'}
      />
    </GoogleMap>
  );
}
