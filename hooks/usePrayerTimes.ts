import { useState, useEffect, useCallback } from 'react';
import { DateInfo, PrayerTime } from '../types/prayer';
import { Coordinates } from '../types/api';
import { PrayerService } from '../api/services/prayerService';
import { GeolocationService } from '../api/services/geolocationService';

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
                const times = await prayerService.getPrayerTimes(coords);
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

    return {
        prayerTimes,
        dateInfo,
        isLoading,
        error,
        refresh,
        fetchForLocation
    };
}