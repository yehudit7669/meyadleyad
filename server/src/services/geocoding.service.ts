import axios from 'axios';
import { config } from '../config';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface GeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
  status: string;
}

/**
 * Geocoding Service - converts addresses to coordinates using Google Maps API
 */
class GeocodingService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor() {
    this.apiKey = config.googleMaps.apiKey;
    
    if (!this.apiKey || this.apiKey === 'your-google-maps-api-key') {
      console.warn('⚠️ Google Maps API Key not configured - Geocoding will not work');
    } else {
      console.log('✅ Google Maps API Key loaded:', this.apiKey.substring(0, 10) + '...');
    }
  }

  /**
   * Convert address string to coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!address) {
      console.warn('⚠️ Geocoding skipped: missing address');
      return null;
    }

    if (!this.apiKey) {
      console.warn('⚠️ Geocoding skipped: missing API key');
      return null;
    }

    console.log('🗺️ Geocoding address:', address);

    try {
      const response = await axios.get<GeocodeResponse>(this.baseUrl, {
        params: {
          address,
          key: this.apiKey,
          language: 'he', // Hebrew results
        },
        timeout: 5000, // 5 second timeout
      });

      console.log('🗺️ Google Maps API response status:', response.data.status);

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        console.log('✅ Geocoding successful:', {
          input: address,
          formatted: result.formatted_address,
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        });
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          formattedAddress: result.formatted_address,
        };
      }

      if (response.data.status === 'ZERO_RESULTS') {
        console.warn('⚠️ Geocoding: No results found for address:', address);
        return null;
      }

      if (response.data.status === 'REQUEST_DENIED') {
        console.error('❌ Geocoding: API key invalid or API not enabled');
        return null;
      }

      console.error('❌ Geocoding error:', response.data.status);
      return null;
    } catch (error: any) {
      console.error('❌ Geocoding service error:', {
        message: error.message,
        response: error.response?.data,
      });
      return null;
    }
  }

  /**
   * Build full address from components
   */
  buildAddress(components: {
    street?: string;
    houseNumber?: string | number;
    neighborhood?: string;
    city?: string;
  }): string {
    const parts: string[] = [];

    if (components.street) {
      parts.push(components.street);
    }

    if (components.houseNumber) {
      parts.push(String(components.houseNumber));
    }

    if (components.city) {
      parts.push(components.city);
    }

    // Add "Israel" for better geocoding accuracy
    if (parts.length > 0) {
      parts.push('ישראל');
    }

    return parts.join(', ');
  }

  /**
   * Geocode with address components
   */
  async geocodeComponents(components: {
    street?: string;
    houseNumber?: string | number;
    neighborhood?: string;
    city?: string;
  }): Promise<GeocodeResult | null> {
    console.log('🗺️ Building address from components:', components);
    const address = this.buildAddress(components);
    console.log('🗺️ Built address:', address);
    return this.geocodeAddress(address);
  }
}

export const geocodingService = new GeocodingService();
