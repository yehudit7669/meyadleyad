// Geolocation Search Component
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface GeolocationSearchProps {
  onLocationFound?: (coords: { lat: number; lng: number }) => void;
}

export default function GeolocationSearch({ onLocationFound }: GeolocationSearchProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNearMeSearch = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('הדפדפן שלך לא תומך במיקום גיאוגרפי');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (onLocationFound) {
          onLocationFound(coords);
        } else {
          // Navigate to search with location params
          navigate(`/search?lat=${coords.lat}&lng=${coords.lng}&radius=10`);
        }
        setLoading(false);
      },
      (error) => {
        let errorMessage = 'לא ניתן לקבל את המיקום שלך';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'אנא אפשר גישה למיקום בהגדרות הדפדפן';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'מיקום לא זמין כרגע';
            break;
          case error.TIMEOUT:
            errorMessage = 'תם הזמן לקבלת מיקום';
            break;
        }

        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-3" dir="rtl">
      <button
        onClick={handleNearMeSearch}
        disabled={loading}
        aria-label="חפש מודעות בסביבתי"
        aria-busy={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">🔄</span>
            <span>מאתר מיקום...</span>
          </>
        ) : (
          <>
            <span>📍</span>
            <span>חפש בסביבתי</span>
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        נמצא מודעות בסביבה של 10 ק"מ ממך
      </div>
    </div>
  );
}

// Utility function to calculate distance between two points
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
