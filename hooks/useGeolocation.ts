import { useState, useEffect } from 'react';
import { Coordinates } from '../types/api';
import { GeolocationService } from '../api/services/geolocationService';

interface UseGeolocationReturn {
    coordinates: Coordinates | null;
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
    isTimeout: boolean; // Indicates if timeout occurred (user may want to enter manually)
}

export function useGeolocation(): UseGeolocationReturn {
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isTimeout, setIsTimeout] = useState(false);

    const geolocationService = new GeolocationService();

    const loadLocation = async () => {
        setIsLoading(true);
        setError(null);
        setIsTimeout(false);

        try {
            const coords = await geolocationService.getCurrentLocation();
            setCoordinates(coords);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to get location';
            setError(err instanceof Error ? err : new Error(errorMsg));

            // Check if it's a timeout error
            if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
                setIsTimeout(true);
                console.warn('Geolocation timeout - user should set manual location');
            } else {
                console.error('Failed to get location:', err);
            }
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
        refresh: loadLocation,
        isTimeout
    };
}