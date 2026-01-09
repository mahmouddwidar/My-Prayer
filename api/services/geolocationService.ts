import { BigDataCloudClient } from '../clients/bigDataCloudClient';
import { StorageManager } from '../../utils/storageUtils';
import { Coordinates, CountryData } from '../../types/api';

export class GeolocationService {
    private client: BigDataCloudClient;
    private storage: StorageManager;

    constructor() {
        this.client = new BigDataCloudClient();
        this.storage = new StorageManager();
    }

    async getCurrentLocation(): Promise<Coordinates> {
        return new Promise(async (resolve, reject) => {
            // 1. First try to get from storage
            const savedLocation = await this.storage.getCoordinates();
            if (savedLocation) {
                console.log('Using saved location:', savedLocation);
                resolve(savedLocation);
                return;
            };

            // 2. Check if geolocation is supported
            if (!navigator.geolocation) {
                console.log('Geolocation not supported, using default location');
                return;
            }


            // 3. Try to get current location with multiple attempts
            let attempts = 0;
            const maxAttempts = 2;

            const attemptGetLocation = () => {
                attempts++;

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const coordinates: Coordinates = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            // accuracy: position.coords.accuracy
                        };

                        console.log('Location obtained:', coordinates);

                        try {
                            // Store for future use
                            await this.storage.setCoordinates(coordinates);

                            // Fetch country data (non-blocking)
                            this.fetchCountryData(coordinates).catch(console.error);

                            resolve(coordinates);
                        } catch (error) {
                            console.error('Failed to process location:', error);
                            resolve(coordinates); // Still resolve even if storage fails
                        }
                    },
                    async (error) => {
                        console.error(`Geolocation attempt ${attempts}/${maxAttempts} failed:`, error);

                        if (attempts < maxAttempts) {
                            // Try again with less accuracy
                            console.log('Retrying with lower accuracy...');
                            setTimeout(attemptGetLocation, 1000);
                        } else {
                            // All attempts failed, use fallback
                            // await this.handleGeolocationFailure(error);
                            reject(error);
                        }
                    },
                    // First attempt: High accuracy
                    attempts === 1 ? {
                        enableHighAccuracy: true,
                        timeout: 10000, // 10 seconds
                        maximumAge: 5 * 60 * 1000 // 5 minutes cache
                    } :
                        // Second attempt: Lower accuracy, faster
                        {
                            enableHighAccuracy: false,
                            timeout: 5000, // 5 seconds
                            maximumAge: 15 * 60 * 1000 // 15 minutes cache
                        }
                );
            };

            attemptGetLocation();
        });
    }


    //     navigator.geolocation.getCurrentPosition(
    // async (position) => {
    //     const coordinates: Coordinates = {
    //         latitude: position.coords.latitude,
    //         longitude: position.coords.longitude
    //     };
    //     console.log(coordinates);


    //     try {
    //         // Store for future use
    //         await this.storage.setCoordinates(coordinates);

    //         // Fetch and store country data
    //         await this.fetchCountryData(coordinates);

    //         resolve(coordinates);
    //     } catch (error) {
    //         console.error('Failed to process location:', error);
    //         resolve(coordinates); // Still resolve with coordinates even if country fetch fails
    //     }
    // },
    //     (error) => {
    //         console.error('Geolocation error:', error);

    //         // Try to get saved location
    //         this.storage.getCoordinates()
    //             .then(saved => {
    //                 if (saved) {
    //                     resolve(saved);
    //                 } else {
    //                     reject(error);
    //                 }
    //             })
    //             .catch(() => reject(error));
    //     },
    // {
    //     enableHighAccuracy: true,
    //     timeout: 10000,
    //     maximumAge: 60000 // 1 minute cache
    // }
    //     );
    // });

    async fetchCountryData(coordinates: Coordinates): Promise<CountryData> {
        try {
            const countryData = await this.client.fetchCountryData(coordinates);
            await this.storage.setCountryData(countryData);
            return countryData;
        } catch (error) {
            console.error('Failed to fetch country data:', error);
            throw error;
        }
    }

    async getCountryData(): Promise<CountryData | null> {
        return this.storage.getCountryData();
    }
}