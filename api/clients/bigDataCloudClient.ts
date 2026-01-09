import { Coordinates, CountryData } from '../../types/api';

export class BigDataCloudClient {
    private static readonly BASE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

    async fetchCountryData(coordinates: Coordinates): Promise<CountryData> {
        const { latitude, longitude } = coordinates;
        const url = `${BigDataCloudClient.BASE_URL}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            return {
                countryCode: data.countryCode,
                countryName: data.countryName,
                city: data.city
            };
        } catch (error) {
            console.error('Failed to fetch country data:', error);
            throw error;
        }
    }
}