import { useLoadScript, GoogleMap, MarkerF, InfoWindow } from '@react-google-maps/api';
import { useMemo, useState, useCallback } from 'react';
import { getImageUrl } from '../utils/imageUrl';

interface Property {
  id: string;
  title: string;
  price?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  images?: { url: string }[];
  city?: { nameHe: string };
  customFields?: any;
}

interface PropertiesMapProps {
  properties: Property[];
  onMarkerClick?: (propertyId: string) => void;
  selectedPropertyId?: string;
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

export default function PropertiesMap({ 
  properties, 
  onMarkerClick,
  selectedPropertyId 
}: PropertiesMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
  });

  // Filter properties that have coordinates
  const propertiesWithCoords = useMemo(() => {
    console.log('🗺️ PropertiesMap - Total properties received:', properties.length);
    
    if (properties.length > 0) {
      console.log('🗺️ PropertiesMap - First 3 properties:', properties.slice(0, 3).map(p => ({
        id: p.id,
        title: p.title,
        latitude: p.latitude,
        longitude: p.longitude,
        latType: typeof p.latitude,
        lngType: typeof p.longitude,
        address: p.address,
        allKeys: Object.keys(p)
      })));
    }
    
    const filtered = properties.filter(p => {
      const hasCoords = p.latitude && p.longitude;
      if (!hasCoords && properties.length > 0) {
        console.log('🗺️ Property without coords:', { 
          id: p.id, 
          title: p.title,
          lat: p.latitude,
          lng: p.longitude 
        });
      }
      return hasCoords;
    });
    
    console.log('🗺️ PropertiesMap - Properties with coords:', filtered.length);
    
    return filtered;
  }, [properties]);

  // Calculate map center based on properties
  const center = useMemo(() => {
    if (propertiesWithCoords.length === 0) {
      // Default to Israel center
      return { lat: 31.7683, lng: 35.2137 };
    }

    // Calculate average position
    const avgLat = propertiesWithCoords.reduce((sum, p) => sum + (p.latitude || 0), 0) / propertiesWithCoords.length;
    const avgLng = propertiesWithCoords.reduce((sum, p) => sum + (p.longitude || 0), 0) / propertiesWithCoords.length;

    return { lat: avgLat, lng: avgLng };
  }, [propertiesWithCoords]);

  // Calculate zoom level based on properties spread
  const zoom = useMemo(() => {
    if (propertiesWithCoords.length === 0) return 8;
    if (propertiesWithCoords.length === 1) return 15;

    // Calculate bounds
    const lats = propertiesWithCoords.map(p => p.latitude!);
    const lngs = propertiesWithCoords.map(p => p.longitude!);
    
    const latDiff = Math.max(...lats) - Math.min(...lats);
    const lngDiff = Math.max(...lngs) - Math.min(...lngs);
    const maxDiff = Math.max(latDiff, lngDiff);

    if (maxDiff > 2) return 8;
    if (maxDiff > 1) return 9;
    if (maxDiff > 0.5) return 10;
    if (maxDiff > 0.2) return 11;
    if (maxDiff > 0.1) return 12;
    if (maxDiff > 0.05) return 13;
    return 14;
  }, [propertiesWithCoords]);

  const handleMarkerClick = useCallback((property: Property) => {
    setSelectedProperty(property);
    if (onMarkerClick) {
      onMarkerClick(property.id);
    }
  }, [onMarkerClick]);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedProperty(null);
  }, []);

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

  // Show message if no properties with coordinates
  if (propertiesWithCoords.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-600 font-medium mb-1">אין נכסים עם מיקום במפה</p>
          <p className="text-gray-500 text-sm">הנכסים בקטגוריה זו אינם כוללים קואורדינטות</p>
        </div>
      </div>
    );
  }

  // Render the map with markers
  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      options={mapOptions}
      onLoad={() => {
        console.log('🗺️ Map loaded! Center:', center, 'Zoom:', zoom);
        console.log('🗺️ Will render', propertiesWithCoords.length, 'markers');
        console.log('🗺️ Properties for markers:', propertiesWithCoords.map(p => ({
          id: p.id,
          title: p.title,
          lat: p.latitude,
          lng: p.longitude
        })));
      }}
    >
      {propertiesWithCoords.length > 0 && propertiesWithCoords.map((property) => {
        const position = { lat: property.latitude!, lng: property.longitude! };
        console.log('🎯 Creating MarkerF component for:', property.title, 'at position:', position);
        
        return (
          <MarkerF
            key={property.id}
            position={position}
            onClick={() => {
              console.log('🎯 Marker clicked:', property.title);
              handleMarkerClick(property);
            }}
            title={property.title}
            icon={{
              path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
              scale: 8,
              fillColor: '#DC2626',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            }}
          />
        );
      })}

      {selectedProperty && (
        <InfoWindow
          position={{ 
            lat: selectedProperty.latitude!, 
            lng: selectedProperty.longitude! 
          }}
          onCloseClick={handleInfoWindowClose}
        >
          <div className="p-2 max-w-[200px]" dir="rtl">
            {selectedProperty.images && selectedProperty.images[0] && (
              <img
                src={getImageUrl(selectedProperty.images[0].url)}
                alt={selectedProperty.title}
                className="w-full h-24 object-cover rounded mb-2"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = '/images/default-property.jpg';
                }}
              />
            )}
            <div className="text-sm font-bold mb-1" style={{ color: '#C9A24D' }}>
              {selectedProperty.price ? `₪${selectedProperty.price.toLocaleString()}` : 'ללא מחיר'}
            </div>
            <div className="text-xs text-gray-700 font-semibold mb-1">
              {selectedProperty.address && selectedProperty.city?.nameHe
                ? `${selectedProperty.address}, ${selectedProperty.city.nameHe}`
                : selectedProperty.address || selectedProperty.city?.nameHe || selectedProperty.title}
            </div>
            {selectedProperty.customFields && (
              <div className="text-xs text-gray-600">
                {selectedProperty.customFields.rooms && (
                  <span>{selectedProperty.customFields.rooms} חד׳ </span>
                )}
                {selectedProperty.customFields.squareMeters && (
                  <span>· {selectedProperty.customFields.squareMeters} מ״ר</span>
                )}
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
