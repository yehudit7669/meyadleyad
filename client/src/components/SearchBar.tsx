import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  showFilters?: boolean;
}

export default function SearchBar({
  initialQuery = '',
  placeholder = 'חפש מודעות...',
  showFilters = true,
}: SearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full" dir="rtl" role="form">
      <div className="relative flex items-center gap-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full px-6 py-4 pr-14 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-[#f8f3f2]"
          />
          <button
            type="submit"
            aria-label="חפש"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-[#c89b4c] text-white hover:bg-[#b88a3d] transition rounded-full p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>

        {/* Advanced Filters Button */}
        {showFilters && (
          <button
            type="button"
            onClick={() => navigate('/search')}
            aria-label="פתח סינון מתקדם"
            className="px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            סינון מתקדם
          </button>
        )}
      </div>
    </form>
  );
}
