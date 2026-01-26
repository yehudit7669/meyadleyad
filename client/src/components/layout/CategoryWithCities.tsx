import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { citiesService } from '../../services/api';

interface City {
  id: string;
  name: string;
  nameHe: string;
  slug: string;
}

interface CategoryWithCitiesProps {
  categorySlug: string;
  categoryName: string;
  isMobile?: boolean;
}

const CategoryWithCities: React.FC<CategoryWithCitiesProps> = ({
  categorySlug,
  categoryName,
  isMobile = false,
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>(''); // Changed to single city
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch cities with automatic refresh
  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: citiesService.getCities,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If no city selected, navigate to category page (all properties)
    if (!selectedCity) {
      navigate(`/category/${categorySlug}`);
      setDropdownOpen(false);
    } else {
      // Navigate to category with city filter
      navigate(`/category/${categorySlug}?cities=${selectedCity}`);
      setDropdownOpen(false);
    }
  };

  const handleCitySelect = (citySlug: string) => {
    setSelectedCity(citySlug);
    navigate(`/category/${categorySlug}?cities=${citySlug}`);
    setDropdownOpen(false);
  };

  if (isMobile) {
    return (
      <div className="relative">
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="block text-[#E6D3A3] hover:text-[#C9A24D] py-2 px-2 transition cursor-pointer"
        >
          {categoryName} {selectedCity && cities.find(c => c.slug === selectedCity) && ` - ${cities.find(c => c.slug === selectedCity)?.nameHe}`}
        </div>
        
        {dropdownOpen && (
          <div className="mt-2 mb-2 bg-[#2A5550] rounded-lg p-3">
            <div className="max-h-48 overflow-y-auto space-y-1">
              {cities.length === 0 ? (
                <div className="text-black text-sm py-2 text-center">
                  אין ערים במערכת
                </div>
              ) : (
                cities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city.slug)}
                    className={`w-full text-right py-2 px-2 rounded transition ${
                      selectedCity === city.slug 
                        ? 'bg-[#C9A24D] text-[#1F3F3A] font-semibold' 
                        : 'hover:bg-[#1F3F3A] text-black'
                    }`}
                  >
                    {city.nameHe}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={() => setDropdownOpen(true)}
      onMouseLeave={() => setDropdownOpen(false)}
    >
      <Link
        to={`/category/${categorySlug}`}
        onClick={handleCategoryClick}
        className="text-[#E6D3A3] hover:text-[#C9A24D] transition font-medium relative group py-2 inline-block"
        aria-label={categoryName}
      >
        {categoryName} {selectedCity && cities.find(c => c.slug === selectedCity) && (
          <span className="text-xs"> - {cities.find(c => c.slug === selectedCity)?.nameHe}</span>
        )}
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C9A24D] transform scale-x-0 group-hover:scale-x-100 transition-transform"></span>
      </Link>

      {/* Cities Dropdown */}
      {dropdownOpen && cities.length > 0 && (
        <div
          className="absolute top-full right-0 mt-2 w-max bg-white rounded-lg shadow-lg py-2 z-50"
        >
          <div className="max-h-80 overflow-y-auto py-2">
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city.slug)}
                className={`w-full text-right px-4 py-2 transition whitespace-nowrap ${
                  selectedCity === city.slug 
                    ? 'bg-[#C9A24D] text-white font-semibold' 
                    : 'hover:bg-gray-100 text-black'
                }`}
              >
                {city.nameHe}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryWithCities;