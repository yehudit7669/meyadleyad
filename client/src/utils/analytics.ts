// Analytics Tracking Utility
class Analytics {
  private static isInitialized = false;

  // Initialize Google Analytics
  static init(trackingId: string) {
    if (this.isInitialized || !trackingId) return;

    // Load GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    gtag('js', new Date());
    gtag('config', trackingId, {
      send_page_view: false, // We'll send manually
    });

    this.isInitialized = true;
  }

  // Track page view
  static pageView(path: string, title?: string) {
    if (!this.isInitialized) return;

    (window as any).gtag?.('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  }

  // Track event
  static event(action: string, params?: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  }) {
    if (!this.isInitialized) return;

    (window as any).gtag?.('event', action, {
      event_category: params?.category,
      event_label: params?.label,
      value: params?.value,
      ...params,
    });
  }

  // E-commerce tracking
  static trackAdView(adId: string, adTitle: string, category: string, price?: number) {
    this.event('view_item', {
      category: 'Ads',
      label: adTitle,
      items: [{
        item_id: adId,
        item_name: adTitle,
        item_category: category,
        price: price,
      }],
    });
  }

  static trackAdClick(adId: string, adTitle: string) {
    this.event('select_content', {
      category: 'Ads',
      label: adTitle,
      content_type: 'ad',
      content_id: adId,
    });
  }

  static trackSearch(searchTerm: string, resultsCount: number) {
    this.event('search', {
      category: 'Search',
      label: searchTerm,
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }

  static trackContactClick(adId: string, contactType: 'phone' | 'whatsapp' | 'email') {
    this.event('contact_click', {
      category: 'Engagement',
      label: contactType,
      ad_id: adId,
      contact_type: contactType,
    });
  }

  static trackAdCreation(adId: string, category: string) {
    this.event('ad_created', {
      category: 'Ads',
      label: category,
      ad_id: adId,
      ad_category: category,
    });
  }

  static trackFavoriteToggle(adId: string, action: 'add' | 'remove') {
    this.event('favorite_toggle', {
      category: 'Engagement',
      label: action,
      ad_id: adId,
      action: action,
    });
  }

  // User tracking
  static setUserId(userId: string) {
    if (!this.isInitialized) return;

    (window as any).gtag?.('config', 'GA_MEASUREMENT_ID', {
      user_id: userId,
    });
  }

  static setUserProperties(properties: Record<string, any>) {
    if (!this.isInitialized) return;

    (window as any).gtag?.('set', 'user_properties', properties);
  }
}

export default Analytics;

// Hook for tracking
export function useAnalytics() {
  return {
    trackPageView: (path: string, title?: string) => Analytics.pageView(path, title),
    trackEvent: (action: string, params?: any) => Analytics.event(action, params),
    trackAdView: (adId: string, adTitle: string, category: string, price?: number) => Analytics.trackAdView(adId, adTitle, category, price),
    trackAdClick: (adId: string, adTitle: string) => Analytics.trackAdClick(adId, adTitle),
    trackSearch: (searchTerm: string, resultsCount: number) => Analytics.trackSearch(searchTerm, resultsCount),
    trackContactClick: (adId: string, contactType: 'phone' | 'whatsapp' | 'email') => Analytics.trackContactClick(adId, contactType),
    trackAdCreation: (adId: string, category: string) => Analytics.trackAdCreation(adId, category),
    trackFavoriteToggle: (adId: string, action: 'add' | 'remove') => Analytics.trackFavoriteToggle(adId, action),
  };
}
