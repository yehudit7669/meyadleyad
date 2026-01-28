import { Link } from 'react-router-dom';

interface AdCardCompactProps {
  ad: {
    id: string;
    title: string;
    price?: number;
    images?: { url: string }[];
    address?: string;
    city?: { nameHe: string };
    customFields?: any;
  };
}

export default function AdCardCompact({ ad }: AdCardCompactProps) {
  const customFields = ad.customFields || {};
  const rooms = customFields.rooms;
  const size = customFields.squareMeters || customFields.size;
  const floor = customFields.floor;

  return (
    <Link
      to={`/ads/${ad.id}`}
      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow block"
    >
      {/* תמונה */}
      <div className="relative overflow-hidden">
        {ad.images && ad.images[0] ? (
          <img
            src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${ad.images[0].url}`}
            alt={ad.title}
            className="w-full h-32 object-cover"
          />
        ) : (
          <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">אין תמונה</span>
          </div>
        )}
      </div>

      {/* תוכן */}
      <div className="p-3">
        {/* מחיר */}
        {ad.price && (
          <div className="text-lg font-bold mb-1" style={{ color: '#C9A24D' }}>
            ₪{ad.price.toLocaleString()}
          </div>
        )}

        {/* כתובת (רחוב מספר בית, עיר) */}
        <div className="text-sm text-gray-700 mb-2 truncate">
          {ad.address && ad.city?.nameHe ? (
            `${ad.address}, ${ad.city.nameHe}`
          ) : ad.address ? (
            ad.address
          ) : ad.city?.nameHe ? (
            ad.city.nameHe
          ) : (
            ad.title
          )}
        </div>

        {/* חדרים, מ"ר, קומה */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {rooms && (
            <span>{rooms} חד׳</span>
          )}
          {size && (
            <>
              {rooms && <span>•</span>}
              <span>{size} מ״ר</span>
            </>
          )}
          {floor != null && (
            <>
              {(rooms || size) && <span>•</span>}
              <span>קומה {floor}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
