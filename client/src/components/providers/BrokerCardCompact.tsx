import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUrl';

interface BrokerCardCompactProps {
  broker: {
    id: string;
    name: string;
    businessName?: string;
    logo?: string;
    city?: string;
    officeAddress?: string;
  };
}

export default function BrokerCardCompact({ broker }: BrokerCardCompactProps) {
  const displayName = broker.businessName || broker.name;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow p-2 h-full flex flex-col">
      {/* לוגו */}
      <div className="relative overflow-hidden rounded-lg">
        {broker.logo ? (
          <img
            src={getImageUrl(broker.logo)}
            alt={displayName}
            className="w-full h-40 object-cover"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = 'none';
              const placeholder = document.createElement('div');
              placeholder.className = 'w-full h-40 bg-gray-50 flex items-center justify-center';
              placeholder.innerHTML = `<div class="w-20 h-20 rounded-full bg-[#3f504f] text-white flex items-center justify-center text-2xl font-bold">${displayName.charAt(0).toUpperCase()}</div>`;
              e.currentTarget.parentElement?.appendChild(placeholder);
            }}
          />
        ) : (
          <div className="w-full h-40 bg-gray-50 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[#3f504f] text-white flex items-center justify-center text-2xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* תוכן */}
      <div className="p-3 flex-1 flex flex-col items-center text-center" style={{ fontFamily: 'Assistant, sans-serif' }}>
        {/* שם המשרד */}
        <div 
          className="text-lg mb-2 font-bold truncate w-full" 
          style={{ color: '#223d3c', fontFamily: 'Assistant, sans-serif' }}
        >
          {displayName}
        </div>

        {/* עיר */}
        {broker.city && (
          <div 
            className="text-sm mb-3 font-bold truncate w-full" 
            style={{ color: '#c89b4c', fontFamily: 'Assistant, sans-serif' }}
          >
            {broker.city}
          </div>
        )}

        {/* לינק לכל הנכסים */}
        <Link
          to={`/brokers/${broker.id}`}
          className="flex items-center gap-1 underline hover:opacity-80 transition mt-auto"
          style={{ color: '#223d3c', fontFamily: 'Assistant, sans-serif' }}
        >
          <span>לכל הנכסים</span>
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
