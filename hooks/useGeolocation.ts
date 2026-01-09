import { useState, useEffect } from 'react';
import { Coordinates } from '../types/api';
import { GeolocationService } from '../api/services/geolocationService';

interface UseGeolocationReturn {
    coordinates: Coordinates | null;
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export function useGeolocation(): UseGeolocationReturn {
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const geolocationService = new GeolocationService();

    const loadLocation = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const coords = await geolocationService.getCurrentLocation();
            setCoordinates(coords);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to get location'));
            console.error('Failed to get location:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLocation();
    }, []);

    return {
        coordinates,
        isLoading,
        error,
        refresh: loadLocation
    };
}