import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { citiesService } from '../../services/api';
import { useDropdownA11y } from '../../hooks/useDropdownA11y';

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
  const [selectedCity, setSelectedCity] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch cities with automatic refresh
  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: citiesService.getCities,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const { 
    triggerRef, 
    menuRef, 
    activeIndex, 
    handleTriggerKeyDown, 
    handleMenuKeyDown 
  } = useDropdownA11y({
    isOpen: dropdownOpen,
    onToggle: setDropdownOpen,
    onSelect: (index) => {
      if (cities[index]) {
        handleCitySelect(cities[index].slug);
      }
    },
    itemCount: cities?.length || 0,
    closeOnSelect: true,
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
      navigate(`/category/${categorySlug}?city=${selectedCity}`);
      setDropdownOpen(false);
    }
  };

  const handleCitySelect = (citySlug: string) => {
    setSelectedCity(citySlug);
    navigate(`/category/${categorySlug}?city=${citySlug}`);
    setDropdownOpen(false);
  };

  if (isMobile) {
    return (
      <div 
        className="relative"
        ref={dropdownRef}
      >
        <button
          ref={triggerRef as React.RefObject<HTMLButtonElement>}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          onKeyDown={handleTriggerKeyDown}
          aria-expanded={dropdownOpen}
          aria-controls="mobile-cities-menu"
          aria-haspopup="listbox"
          className="block text-[#E6D3A3] hover:text-[#C9A24D] py-2 px-2 transition cursor-pointer w-full text-right"
        >
          {categoryName} {selectedCity && cities.find(c => c.slug === selectedCity) && ` - ${cities.find(c => c.slug === selectedCity)?.nameHe}`}
        </button>
        
        {dropdownOpen && (
          <div 
            id="mobile-cities-menu"
            ref={menuRef as React.RefObject<HTMLDivElement>}
            role="listbox"
            onKeyDown={handleMenuKeyDown}
            className="mt-2 mb-2 bg-[#2A5550] rounded-lg p-3"
          >
            <div className="max-h-48 overflow-y-auto space-y-1">
              {cities.length === 0 ? (
                <div className="text-[#E6D3A3] text-sm py-2 text-center">
                  אין ערים במערכת
                </div>
              ) : (
                cities.map((city, index) => (
                  <button
                    key={city.id}
                    role="option"
                    aria-selected={selectedCity === city.slug}
                    onClick={() => handleCitySelect(city.slug)}
                    className={`w-full text-right py-2 px-2 rounded transition ${
                      index === activeIndex ? 'ring-2 ring-[#C9A24D]' : ''
                    } ${
                      selectedCity === city.slug 
                        ? 'bg-[#C9A24D] text-[#1F3F3A] font-semibold' 
                        : 'hover:bg-[#1F3F3A] text-[#E6D3A3]'
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
        ref={triggerRef as React.RefObject<HTMLAnchorElement>}
        to={`/category/${categorySlug}`}
        onClick={handleCategoryClick}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={dropdownOpen}
        aria-controls="desktop-cities-menu"
        aria-haspopup="listbox"
        className="text-[#3f504f] hover:text-[#2f403f] transition font-bold relative group py-2 inline-block"
        style={{ fontFamily: 'Assistant, sans-serif' }}
        aria-label={categoryName}
      >
        {categoryName}
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#2f403f] transition-all duration-300 group-hover:w-full"></span>
      </Link>
      
      {dropdownOpen && (
        <div 
          id="desktop-cities-menu"
          ref={menuRef as React.RefObject<HTMLDivElement>}
          role="listbox"
          onKeyDown={handleMenuKeyDown}
          className="absolute top-full right-0 mt-2 w-max bg-white rounded-lg shadow-lg py-2 z-50"
        >
          <div className="max-h-80 overflow-y-auto py-2">
            {cities.map((city, index) => (
              <button
                key={city.id}
                role="option"
                aria-selected={selectedCity === city.slug}
                onClick={() => handleCitySelect(city.slug)}
                className={`w-full text-right px-4 py-2 transition whitespace-nowrap ${
                  index === activeIndex ? 'ring-2 ring-[#C9A24D]' : ''
                } ${
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