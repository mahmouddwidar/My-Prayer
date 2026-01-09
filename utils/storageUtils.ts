import { PrayerData } from '../types/prayer';
import { Coordinates, CountryData } from '../types/api';

export class StorageManager {
    private static readonly PRAYER_DATA_KEY = 'prayerData';
    private static readonly COORDINATES_KEY = 'coordinates';
    private static readonly COUNTRY_DATA_KEY = 'countryData';
    private static readonly LAST_UPDATED_KEY = 'lastUpdated';

    async setPrayerData(data: PrayerData): Promise<void> {
        try {
            await browser.storage.local.set({
                [StorageManager.PRAYER_DATA_KEY]: data,
                [StorageManager.LAST_UPDATED_KEY]: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to save prayer data:', error);
        }
    }

    async getPrayerData(): Promise<PrayerData | null> {
        try {
            const result = await browser.storage.local.get(StorageManager.PRAYER_DATA_KEY);
            return result[StorageManager.PRAYER_DATA_KEY] || null;
        } catch (error) {
            console.error('Failed to get prayer data:', error);
            return null;
        }
    }

    async setCoordinates(coordinates: Coordinates): Promise<void> {
        try {
            await browser.storage.local.set({
                [StorageManager.COORDINATES_KEY]: coordinates
            });
        } catch (error) {
            console.error('Failed to save coordinates:', error);
        }
    }

    async getCoordinates(): Promise<Coordinates | null> {
        try {
            const result = await browser.storage.local.get(StorageManager.COORDINATES_KEY);
            return result[StorageManager.COORDINATES_KEY] || null;
        } catch (error) {
            console.error('Failed to get coordinates:', error);
            return null;
        }
    }

    async setCountryData(countryData: CountryData): Promise<void> {
        try {
            await browser.storage.local.set({
                [StorageManager.COUNTRY_DATA_KEY]: countryData
            });
        } catch (error) {
            console.error('Failed to save country data:', error);
        }
    }

    async getCountryData(): Promise<CountryData | null> {
        try {
            const result = await browser.storage.local.get(StorageManager.COUNTRY_DATA_KEY);
            return (result[StorageManager.COUNTRY_DATA_KEY] as CountryData) || null;
        } catch (error) {
            console.error('Failed to get country data:', error);
            return null;
        }
    }
}