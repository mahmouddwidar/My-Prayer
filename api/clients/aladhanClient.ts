import { PrayerData, ApiResponse } from '../../types/prayer';
import { Coordinates } from '../../types/api';

export class AladhanClient {
    private static readonly BASE_URL = 'https://api.aladhan.com/v1';

    async fetchPrayerTimes(
        coordinates: Coordinates,
        method: number = 2
    ): Promise<PrayerData> {
        const { latitude, longitude } = coordinates;
        const url = `${AladhanClient.BASE_URL}/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result: ApiResponse<PrayerData> = await response.json();

            if (result.code !== 200) {
                throw new Error(`API Error: ${result.status}`);
            }

            console.log(result.data);
            
            return result.data;
        } catch (error) {
            console.error('Failed to fetch prayer times:', error);
            throw error;
        }
    }

    // We Can remove this func. later if not needed
    // async fetchPrayerCalendar(
    //     coordinates: Coordinates,
    //     month: number,
    //     year: number,
    //     method: number = 2
    // ) {
    //     const { latitude, longitude } = coordinates;
    //     const url = `${AladhanClient.BASE_URL}/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=${method}`;

    //     const response = await fetch(url);
    //     return response.json();
    // }
}