import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUrl';

interface ProviderCardProps {
  provider: {
    id: string;
    name: string;
    businessName?: string;
    logo?: string;
    type: string;
    city?: string;
    cityId?: string;
  };
}

export default function ProviderCard({ provider }: ProviderCardProps) {
  // Determine the link based on provider type
  const providerLink = provider.type === 'BROKER' 
    ? `/brokers/${provider.id}` 
    : `/providers/${provider.id}`;

  const displayName = provider.businessName || provider.name;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow p-4 h-full flex flex-col">
      {/* לוגו */}
      <div className="relative overflow-hidden rounded-lg mb-4 flex items-center justify-center bg-gray-50" style={{ height: '160px' }}>
        {provider.logo ? (
          <img
            src={getImageUrl(provider.logo)}
            alt={displayName}
            className="w-full h-full object-contain p-2"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              // Show initials on error
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="w-24 h-24 rounded-full bg-[#3f504f] text-white flex items-center justify-center text-3xl font-bold">${displayName.charAt(0).toUpperCase()}</div>`;
              }
            }}
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-[#3f504f] text-white flex items-center justify-center text-3xl font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* תוכן */}
      <div className="flex-1 flex flex-col">
        {/* שם המשרד */}
        <div className="text-lg font-bold text-[#1F3F3A] mb-2 text-center line-clamp-2 min-h-[3.5rem]">
          {displayName}
        </div>

        {/* עיר */}
        {provider.city && (
          <div className="text-sm text-gray-600 mb-4 text-center">
            {provider.city}
          </div>
        )}

        {/* כפתור לכל הנכסים */}
        <Link
          to={providerLink}
          className="mt-auto bg-[#3f504f] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#2f403f] transition text-center"
        >
          לכל הנכסים
        </Link>
      </div>
    </div>
  );
}
