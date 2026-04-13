import { useState, useEffect, useCallback } from 'react';
import { DateInfo, PrayerTime } from '../types/prayer';
import { Coordinates } from '../types/api';
import { PrayerService } from '../api/services/prayerService';
import { GeolocationService } from '../api/services/geolocationService';
import { StorageManager } from '../utils/storageUtils';

interface UsePrayerTimesReturn {
    prayerTimes: PrayerTime[];
    dateInfo: DateInfo | null;
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
    fetchForLocation: (coordinates: Coordinates) => Promise<void>;
}

export function usePrayerTimes(): UsePrayerTimesReturn {
    const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
    const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const prayerService = new PrayerService();
    const geolocationService = new GeolocationService();
    const storageManager = new StorageManager();

    const loadPrayerTimes = useCallback(async (coordinates?: Coordinates) => {
        setIsLoading(true);
        setError(null);

        try {
            let coords = coordinates;

            // If no coordinates provided, try to get current location
            if (!coords) {
                coords = await geolocationService.getCurrentLocation();
            }

            if (coords) {
                // Always pass forceRefresh=false for the service to handle location comparison
                const times = await prayerService.getPrayerTimes(coords, false);
                setPrayerTimes(times);
                const dateInfo = await prayerService.getDateInfo();
                setDateInfo(dateInfo);
            } else {
                throw new Error('Unable to determine location');
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load prayer times'));
            console.error('Failed to load prayer times:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        await loadPrayerTimes();
    }, [loadPrayerTimes]);

    const fetchForLocation = useCallback(async (coordinates: Coordinates) => {
        await loadPrayerTimes(coordinates);
    }, [loadPrayerTimes]);

    // Load on mount
    useEffect(() => {
        loadPrayerTimes();
    }, [loadPrayerTimes]);

    // Listen for manual location updates from storage
    useEffect(() => {
        const handleStorageChange = async (changes: { [key: string]: browser.storage.StorageChange }, areaName: string) => {
            if (areaName !== 'local') return;

            if (changes.manualLocation && changes.manualLocation.newValue) {
                const newLocation = changes.manualLocation.newValue as Coordinates;
                console.log('Manual location updated to:', newLocation);
                // Fetch prayer times with new coordinates
                await loadPrayerTimes(newLocation);
            }
        };

        browser.storage.onChanged.addListener(handleStorageChange);
        return () => browser.storage.onChanged.removeListener(handleStorageChange);
    }, [loadPrayerTimes]);

    // Listen for messages from options page (for message-based updates as fallback)
    useEffect(() => {
        const handleMessage = async (message: any) => {
            if (message.type === 'LOCATION_UPDATED' && message.location) {
                console.log('Location updated from settings, fetching new prayer times...');
                await loadPrayerTimes(message.location as Coordinates);
            } else if (message.type === 'LOCATION_CLEARED') {
                console.log('Location cleared, falling back to auto-geolocation...');
                await loadPrayerTimes();
            }
        };

        browser.runtime.onMessage.addListener(handleMessage);
        return () => browser.runtime.onMessage.removeListener(handleMessage);
    }, [loadPrayerTimes]);

    return {
        prayerTimes,
        dateInfo,
        isLoading,
        error,
        refresh,
        fetchForLocation
    };
}