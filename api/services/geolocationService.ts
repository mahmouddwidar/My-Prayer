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

    private getErrorMessage(error: any): string {
        // Handle GeolocationPositionError
        if (error?.code) {
            switch (error.code) {
                case 1:
                    return 'Permission denied. Please enable location access in browser settings.';
                case 2:
                    return 'Location service unavailable. Please check your connection.';
                case 3:
                    return 'Location request timed out. Try setting your location manually in Settings.';
                default:
                    return `Geolocation error: ${error.message || 'Unknown error'}`;
            }
        }
        return error?.message || 'Failed to get location';
    }

    async getCurrentLocation(): Promise<Coordinates> {
        return new Promise(async (resolve, reject) => {
            // 1. First try to get manual location from storage
            const manualLocation = await this.storage.getManualLocation();
            if (manualLocation) {
                console.log('Using manual location:', manualLocation);
                resolve(manualLocation);
                return;
            }

            // 2. Then try to get from auto-saved location storage
            const savedLocation = await this.storage.getCoordinates();
            if (savedLocation) {
                console.log('Using saved location:', savedLocation);
                resolve(savedLocation);
                return;
            }

            // 3. Check if geolocation is supported
            if (!navigator.geolocation) {
                console.log('Geolocation not supported, using default location');
                reject(new Error('Geolocation not supported and no manual location set'));
                return;
            }

            // 4. Try to get current location with optimized strategy
            let attempts = 0;
            const maxAttempts = 2;
            let timeoutHandle: ReturnType<typeof setTimeout>;

            const attemptGetLocation = () => {
                attempts++;

                // Create a timeout promise that races against geolocation
                const timeoutPromise = new Promise<never>((_, timeoutReject) => {
                    const timeoutDuration = attempts === 1 ? 8000 : 4000; // Reduced from 10s/5s
                    timeoutHandle = setTimeout(() => {
                        timeoutReject(new Error('Geolocation timeout'));
                    }, timeoutDuration);
                });

                const locationPromise = new Promise<GeolocationCoordinates>((locResolve, locReject) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            clearTimeout(timeoutHandle);
                            locResolve(position.coords);
                        },
                        (error) => {
                            clearTimeout(timeoutHandle);
                            locReject(error);
                        },
                        {
                            enableHighAccuracy: attempts === 1,
                            timeout: attempts === 1 ? 8000 : 4000,
                            maximumAge: attempts === 1 ? 5 * 60 * 1000 : 15 * 60 * 1000
                        }
                    );
                });

                // Race between timeout and location
                Promise.race([locationPromise, timeoutPromise])
                    .then(async (coords) => {
                        const coordinates: Coordinates = {
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                        };

                        console.log('Location obtained:', coordinates);

                        try {
                            // Store for future use
                            await this.storage.setCoordinates(coordinates);
                            // Fetch country data non-blocking
                            this.fetchCountryData(coordinates).catch(console.error);
                            resolve(coordinates);
                        } catch (error) {
                            console.error('Failed to process location:', error);
                            resolve(coordinates); // Still resolve even if storage fails
                        }
                    })
                    .catch(async (error) => {
                        console.error(`Geolocation attempt ${attempts}/${maxAttempts} failed:`, error.message);

                        if (attempts < maxAttempts) {
                            console.log('Retrying with lower accuracy...');
                            // Smaller delay between retries
                            setTimeout(attemptGetLocation, 500);
                        } else {
                            // All attempts failed
                            const errorMessage = this.getErrorMessage(error);
                            reject(new Error(errorMessage));
                        }
                    });
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