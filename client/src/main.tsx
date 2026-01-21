import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import Analytics from './utils/analytics';
import { getApiBaseUrl } from './config/env';

console.log("🎨 CSS loaded - Tailwind should work now");

// CRITICAL: Log raw env values to debug Vercel injection
console.log('🚀 Application Starting...');
console.log('📊 Raw ENV Values:');
console.log('   MODE:', import.meta.env.MODE);
console.log('   PROD:', import.meta.env.PROD);
console.log('   DEV:', import.meta.env.DEV);
console.log('   VITE_API_URL (raw):', import.meta.env.VITE_API_URL);
console.log('');
console.log('🔧 Computed API Base URL:', getApiBaseUrl());

if (import.meta.env.DEV) {
  console.log('📍 Running in DEVELOPMENT mode');
} else {
  console.log('🌍 Running in PRODUCTION mode');
  console.log('⚠️  Verify VITE_API_URL is NOT empty above!');
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
