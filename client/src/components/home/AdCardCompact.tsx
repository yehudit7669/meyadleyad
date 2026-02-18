import { Link } from 'react-router-dom';

interface AdCardCompactProps {
  ad: {
    id: string;
    title: string;
    price?: number;
    images?: { url: string }[];
    address?: string;
    city?: { nameHe: string };
    category?: { nameHe: string };
    customFields?: any;
  };
  showCategory?: boolean;
}

export default function AdCardCompact({ ad, showCategory = false }: AdCardCompactProps) {
  const customFields = ad.customFields || {};
  const rooms = customFields.rooms;
  const size = customFields.squareMeters || customFields.size;
  const floor = customFields.floor;

  return (
    <Link
      to={`/ads/${ad.id}`}
      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow p-2 h-full flex flex-col"
    >
      {/* תמונה */}
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={ad.images && ad.images[0] 
            ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${ad.images[0].url}`
            : '/images/default-property.jpg'
          }
          alt={ad.title}
          className="w-full h-40 object-cover"
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = '/images/default-property.jpg';
          }}
        />
      </div>

      {/* תוכן */}
      <div className="p-3 flex-1 flex flex-col">
        {/* קטגוריה */}
        {showCategory && ad.category && (
          <div className="text-xs font-semibold text-[#1F3F3A] mb-2 bg-[#E6D3A3] px-2 py-1 rounded inline-block">
            {ad.category.nameHe}
          </div>
        )}

        {/* מחיר */}
        <div className="text-lg mb-1" style={{ color: '#C9A24D' }}>
          {ad.price ? `₪${ad.price.toLocaleString()}` : 'לא צוין'}
        </div>

        {/* כתובת (רחוב מספר בית, עיר) */}
        <div className="text-xs text-gray-700 font-bold mb-2 truncate">
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
        <div className="flex items-center gap-2 text-xs text-gray-600 mt-auto min-h-[20px]">
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
