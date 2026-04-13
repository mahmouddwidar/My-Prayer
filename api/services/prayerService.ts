import { AladhanClient } from '../clients/aladhanClient';
import { BigDataCloudClient } from '../clients/bigDataCloudClient';
import { StorageManager } from '../../utils/storageUtils';
import {
    PrayerData,
    PrayerTime,
    PrayerName,
    DateInfo
} from '../../types/prayer';
import { Coordinates } from '../../types/api';
import { parseTimeToDate } from '../../utils/prayerUtils';

export class PrayerService {
    private client: AladhanClient;
    private geoClient: BigDataCloudClient;
    private storage: StorageManager;
    private lastFetchedCoordinates: Coordinates | null = null;

    constructor() {
        this.client = new AladhanClient();
        this.geoClient = new BigDataCloudClient();
        this.storage = new StorageManager();
    }


    async fetchAndStorePrayerTimes(
        coordinates: Coordinates,
        method: number = 3
    ): Promise<PrayerData> {
        try {
            // Fetch and store country data if not already cached
            await this.fetchAndStoreCountryData(coordinates);

            // Get method based on country
            const countryData = await this.storage.getCountryData();
            method = this.getMethodByCountry(countryData?.countryCode || '');

            // Fetch from API
            const prayerData = await this.client.fetchPrayerTimes(coordinates, method);

            // Store in browser storage
            await this.storage.setPrayerData(prayerData);

            // Also store coordinates for future use
            await this.storage.setCoordinates(coordinates);

            return prayerData;
        } catch (error) {
            console.error('PrayerService: Failed to fetch and store prayer times:', error);

            // Try to get cached data
            const cached = await this.storage.getPrayerData();
            if (cached) {
                console.log('Using cached prayer data');
                return cached;
            }

            throw error;
        }
    }

    private async fetchAndStoreCountryData(coordinates: Coordinates): Promise<void> {
        try {
            const cachedCountryData = await this.storage.getCountryData();
            if (cachedCountryData) {
                return; // Already cached
            }

            const countryData = await this.geoClient.fetchCountryData(coordinates);
            await this.storage.setCountryData(countryData);
            console.log('Country data fetched and stored:', countryData);
        } catch (error) {
            console.error('Failed to fetch country data:', error);
            // Continue without country data, will use default method
        }
    }


    private getMethodByCountry(countryCode: string): number {
        const methods: { [key: string]: number } = {
            AE: 16,
            EG: 5,
            IN: 1,
            IQ: 3,
            IR: 7,
            KW: 9,
            MY: 3,
            PK: 1,
            QA: 10,
            SA: 4,
            SG: 11,
            TR: 13,
            US: 2,
            FR: 12,
            RU: 14,
        };
        return methods[countryCode] || 3; // Default to Muslim World League
    }

    async getPrayerTimes(
        coordinates?: Coordinates,
        forceRefresh: boolean = false
    ): Promise<PrayerTime[]> {
        // Check if we have cached data and it's not expired
        const cachedData = await this.storage.getPrayerData();
        const cachedCoordinates = await this.storage.getCoordinates();

        // Determine if we need to refresh based on:
        // 1. forceRefresh flag
        // 2. No cached data
        // 3. Data expired (different date)
        // 4. LOCATION CHANGED (different coordinates)
        const locationChanged = coordinates && cachedCoordinates &&
            (Math.abs(coordinates.latitude - cachedCoordinates.latitude) > 0.01 ||
                Math.abs(coordinates.longitude - cachedCoordinates.longitude) > 0.01);

        const shouldRefresh = forceRefresh || !cachedData || this.isDataExpired(cachedData) || locationChanged;

        if (shouldRefresh && coordinates) {
            await this.fetchAndStorePrayerTimes(coordinates);
            this.lastFetchedCoordinates = coordinates;
        }

        const data = await this.storage.getPrayerData();
        if (!data) {
            throw new Error('No prayer data available');
        }

        return this.transformPrayerData(data);
    }

    private transformPrayerData(data: PrayerData): PrayerTime[] {
        const prayerOrder: PrayerName[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

        return prayerOrder.map(name => ({
            name,
            time: data.timings[name],
            timestamp: parseTimeToDate(data.timings[name])
        }));
    }

    private isDataExpired(data: PrayerData): boolean {
        // Check if data is from today
        const today = new Date().toDateString();
        const dataDate = new Date().toDateString(); // You might want to store the actual date
        return today !== dataDate;
    }

    async getDateInfo(): Promise<DateInfo> {
        const data = await this.storage.getPrayerData();
        if (!data) {
            throw new Error('No prayer data available');
        }
        return { weekday: data.date.gregorian.weekday.en, day: data.date.hijri.day, month: data.date.hijri.month.en };
    }
}