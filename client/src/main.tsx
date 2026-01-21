import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import Analytics from './utils/analytics';
import { getApiBaseUrl } from './config/env';

console.log("🎨 CSS loaded - Tailwind should work now");

// Log API configuration for debugging (CRITICAL FOR PRODUCTION VERIFICATION)
console.log('🚀 Application Starting...');
console.log('🔧 API Base URL:', getApiBaseUrl());

if (import.meta.env.DEV) {
  console.log('📍 Running in DEVELOPMENT mode');
  console.log('   All API requests will go to:', getApiBaseUrl());
} else {
  console.log('🌍 Running in PRODUCTION mode');
  console.log('   VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('   All requests MUST go to backend, NOT to Vercel');
}

// Initialize Analytics
const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID;
if (GA_TRACKING_ID) {
  Analytics.init(GA_TRACKING_ID);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
