import { Coordinates } from '../../types/api';

export interface GeocodingResult {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    state?: string;
}

export class GeocodingClient {
    /**
     * Search for coordinates using Nominatim (OpenStreetMap)
     * Free service, no API key required
     */
    static async searchByCity(cityName: string): Promise<GeocodingResult[]> {
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                cityName
            )}&format=json&limit=5`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'MyPrayerExtension'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const results = await response.json();

            if (!Array.isArray(results) || results.length === 0) {
                return [];
            }

            return results.map((result: any) => ({
                city: result.address?.city || result.name || cityName,
                country: result.address?.country || '',
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                state: result.address?.state
            }));
        } catch (error) {
            console.error('Geocoding search failed:', error);
            throw new Error('Failed to search for location. Please try again.');
        }
    }

    /**
     * Get location details from coordinates
     * Reverse geocoding
     */
    static async reverseGeocode(
        coordinates: Coordinates
    ): Promise<GeocodingResult | null> {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${coordinates.latitude}&lon=${coordinates.longitude}&format=json`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'MyPrayerExtension'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            const address = result.address || {};

            return {
                city: address.city || address.town || address.village || 'Unknown',
                country: address.country || 'Unknown',
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                state: address.state
            };
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            return null;
        }
    }
}
