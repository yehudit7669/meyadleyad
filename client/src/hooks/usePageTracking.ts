import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Analytics from '../utils/analytics';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    Analytics.pageView(location.pathname + location.search, document.title);
  }, [location]);
}
