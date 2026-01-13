interface AdMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
}

export default function AdMap({ latitude, longitude, address }: AdMapProps) {
  // Placeholder for map component
  // In the future, you can integrate Google Maps or other map services
  
  if (!latitude || !longitude) {
    return null;
  }

  return (
    <div className="bg-gray-100 rounded-lg p-4">
      <h3 className="text-lg font-bold mb-2">מיקום</h3>
      {address && <p className="text-gray-600 mb-2">{address}</p>}
      <div className="bg-gray-200 rounded h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>מפה</p>
          <p className="text-sm">Lat: {latitude}, Lng: {longitude}</p>
        </div>
      </div>
    </div>
  );
}
