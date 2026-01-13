// Search Autocomplete Component
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '../services/api';

interface AutocompleteProps {
  placeholder?: string;
  onSelect?: (result: any) => void;
}

export default function SearchAutocomplete({
  placeholder = 'חפש מודעות...',
  onSelect,
}: AutocompleteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['autocomplete', query],
    queryFn: () => searchService.autocomplete(query),
    enabled: query.length >= 2,
  }) as { data: any | undefined; isLoading: boolean };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: any) => {
    if (onSelect) {
      onSelect(result);
    } else {
      if (result.type === 'ad') {
        navigate(`/ads/${result.id}`);
      } else if (result.type === 'category') {
        navigate(`/category/${result.slug}`);
      } else if (result.type === 'city') {
        navigate(`/city/${result.slug}`);
      } else if (result.type === 'street') {
        // ניווט לחיפוש לפי עיר + רחוב
        navigate(`/search?city=${result.cityId}&street=${encodeURIComponent(result.street)}`);
      }
    }
    setShowResults(false);
    setQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full" dir="rtl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder={placeholder}
            className="w-full px-6 py-4 pr-14 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <button
            type="submit"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Autocomplete Results */}
      {showResults && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">מחפש...</div>
          ) : !suggestions || suggestions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">לא נמצאו תוצאות</div>
          ) : (
            <div>
              {/* Ads */}
              {suggestions.ads && suggestions.ads.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 font-bold text-sm text-gray-700">
                    מודעות
                  </div>
                  {suggestions.ads.map((ad: any) => (
                    <button
                      key={ad.id}
                      onClick={() => handleSelect({ ...ad, type: 'ad' })}
                      aria-label={`עבור למודעה ${ad.title}`}
                      className="w-full px-4 py-3 hover:bg-blue-50 transition text-right flex items-center gap-3"
                    >
                      {ad.images && ad.images[0] ? (
                        <img src={ad.images[0].url} alt="" className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          📷
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{ad.title}</div>
                        <div className="text-sm text-gray-600">{ad.category.nameHe}</div>
                      </div>
                      {ad.price && (
                        <div className="text-green-600 font-bold">₪{ad.price.toLocaleString()}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Categories */}
              {suggestions.categories && suggestions.categories.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 font-bold text-sm text-gray-700">
                    קטגוריות
                  </div>
                  {suggestions.categories.map((category: any) => (
                    <button
                      key={category.id}
                      onClick={() => handleSelect({ ...category, type: 'category' })}
                      aria-label={`חפש בקטגוריה ${category.nameHe}`}
                      className="w-full px-4 py-3 hover:bg-blue-50 transition text-right flex items-center gap-3"
                    >
                      <span className="text-2xl">{category.icon || '📁'}</span>
                      <span className="font-medium">{category.nameHe}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Cities */}
              {suggestions.cities && suggestions.cities.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 font-bold text-sm text-gray-700">
                    ערים
                  </div>
                  {suggestions.cities.map((city: any) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelect({ ...city, type: 'city' })}
                      aria-label={`חפש בעיר ${city.nameHe}`}
                      className="w-full px-4 py-3 hover:bg-blue-50 transition text-right flex items-center gap-3"
                    >
                      <span className="text-2xl">📍</span>
                      <span className="font-medium">{city.nameHe}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Streets */}
              {suggestions.streets && suggestions.streets.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 font-bold text-sm text-gray-700">
                    רחובות
                  </div>
                  {suggestions.streets.map((street: any, index: number) => (
                    <button
                      key={`${street.street}-${street.cityId}-${index}`}
                      onClick={() => handleSelect({ ...street, type: 'street' })}
                      aria-label={`חפש ברחוב ${street.street}, ${street.city}`}
                      className="w-full px-4 py-3 hover:bg-blue-50 transition text-right flex items-center gap-3"
                    >
                      <span className="text-2xl">🛣️</span>
                      <div className="flex-1">
                        <div className="font-medium">{street.street}</div>
                        <div className="text-sm text-gray-600">{street.city}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
