import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUrl';

interface ServiceProviderCardCompactProps {
  provider: {
    id: string;
    name: string;
    businessName?: string;
    logo?: string;
    city?: string;
  };
}

export default function ServiceProviderCardCompact({ provider }: ServiceProviderCardCompactProps) {
  const displayName = provider.businessName || provider.name;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow p-2 h-full flex flex-col">
      {/* לוגו */}
      <div className="relative overflow-hidden rounded-lg flex items-center justify-center bg-gray-50" style={{ height: '160px' }}>
        {provider.logo ? (
          <img
            src={getImageUrl(provider.logo)}
            alt={displayName}
            className="w-full h-full object-contain p-2"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="w-20 h-20 rounded-full bg-[#3f504f] text-white flex items-center justify-center text-2xl font-bold">${displayName.charAt(0).toUpperCase()}</div>`;
              }
            }}
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#3f504f] text-white flex items-center justify-center text-2xl font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* תוכן */}
      <div className="p-3 flex-1 flex flex-col items-center text-center" style={{ fontFamily: 'Assistant, sans-serif' }}>
        {/* שם העסק */}
        <div 
          className="text-lg mb-2 font-bold truncate w-full" 
          style={{ color: '#223d3c' }}
        >
          {displayName}
        </div>

        {/* עיר */}
        {provider.city && (
          <div 
            className="text-sm mb-3 truncate w-full" 
            style={{ color: '#c89b4c' }}
          >
            {provider.city}
          </div>
        )}

        {/* לינק לעמוד נותן השירות */}
        <Link
          to={`/providers/${provider.id}`}
          className="flex items-center gap-1 underline hover:opacity-80 transition"
          style={{ color: '#223d3c', fontFamily: 'Assistant, sans-serif' }}
        >
          <span>לעמוד נותן השירות</span>
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="#c89b4c" 
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
