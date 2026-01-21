import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import Analytics from './utils/analytics';

console.log("🎨 CSS loaded - Tailwind should work now");

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
