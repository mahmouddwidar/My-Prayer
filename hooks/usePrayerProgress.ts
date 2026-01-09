import { useState, useEffect, useCallback } from 'react';
import { calculateProgress, ProgressResult } from '../utils/progressCalculator';

interface UsePrayerProgressProps {
    previousPrayerTime: Date;
    nextPrayerTime: Date;
    updateInterval?: number; // milliseconds
}

export function usePrayerProgress({
    previousPrayerTime,
    nextPrayerTime,
    updateInterval = 1000
}: UsePrayerProgressProps): ProgressResult & { isLoading: boolean } {
    const [progressData, setProgressData] = useState<ProgressResult>({
        progress: 0,
        timeRemaining: 'Calculating...',
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    const updateProgress = useCallback(() => {
        const result = calculateProgress(previousPrayerTime, nextPrayerTime);
        setProgressData(result);
        setIsLoading(false);
    }, [previousPrayerTime, nextPrayerTime]);

    useEffect(() => {
        // Initial update
        updateProgress();

        // Set up interval
        const interval = setInterval(updateProgress, updateInterval);

        // Cleanup
        return () => clearInterval(interval);
    }, [updateProgress, updateInterval]);

    return { ...progressData, isLoading };
}