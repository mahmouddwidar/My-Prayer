import { useState, useEffect, useCallback, useRef } from 'react';
import { PrayerTime } from '../types/prayer';
import { findNextPrayer } from '../utils/prayerUtils';

interface RealtimePrayerState {
    previous: PrayerTime;
    next: PrayerTime;
    progress: number;
}

interface UseRealtimePrayerTimesProps {
    prayerTimes: PrayerTime[];
    enabled?: boolean;
    checkInterval?: number; // milliseconds - how often to check if prayer changed
}

/**
 * Hook that provides real-time prayer tracking
 * Automatically updates when the current prayer changes
 * More efficient than recalculating every second - only recalculates at intervals
 * 
 * Usage:
 * const { previous, next, progress, hasChanged } = useRealtimePrayerTimes(prayerTimes);
 */
export function useRealtimePrayerTimes({
    prayerTimes,
    enabled = true,
    checkInterval = 10000 // Check every 10 seconds - balance between accuracy and performance
}: UseRealtimePrayerTimesProps) {
    const [prayerState, setPrayerState] = useState<RealtimePrayerState | null>(null);
    const [hasChanged, setHasChanged] = useState(false);
    const previousPrayerIdRef = useRef<string>('');

    const calculateCurrentPrayer = useCallback(() => {
        if (!prayerTimes || prayerTimes.length === 0) return null;

        const result = findNextPrayer(prayerTimes);
        return result;
    }, [prayerTimes]);

    // Initialize on mount
    useEffect(() => {
        if (!enabled || !prayerTimes.length) return;

        const initialState = calculateCurrentPrayer();
        if (initialState) {
            setPrayerState(initialState);
            previousPrayerIdRef.current = initialState.previous.name;
        }
    }, [prayerTimes, enabled, calculateCurrentPrayer]);

    // Set up interval to check for prayer changes
    useEffect(() => {
        if (!enabled || !prayerTimes.length) return;

        const interval = setInterval(() => {
            const currentState = calculateCurrentPrayer();

            if (currentState) {
                // Check if the current prayer has changed
                const prayerChanged = previousPrayerIdRef.current !== currentState.previous.name;

                if (prayerChanged) {
                    console.log(
                        `🔄 Prayer changed: ${previousPrayerIdRef.current} → ${currentState.previous.name}`
                    );
                    setHasChanged(true);
                    // Reset hasChanged flag after a brief moment
                    setTimeout(() => setHasChanged(false), 100);
                }

                setPrayerState(currentState);
                previousPrayerIdRef.current = currentState.previous.name;
            }
        }, checkInterval);

        return () => clearInterval(interval);
    }, [enabled, prayerTimes, calculateCurrentPrayer, checkInterval]);

    // Also listen for more granular time changes in progress
    // This ensures smooth UI updates even between check intervals
    useEffect(() => {
        if (!enabled || !prayerTimes.length || !prayerState) return;

        const interval = setInterval(() => {
            const currentState = calculateCurrentPrayer();

            if (currentState) {
                // Update state with new progress calculation every second
                // but keep the same prayer (unless it changed from the outer interval)
                setPrayerState(currentState);
            }
        }, 1000); // Fine-grained updates for smooth UX

        return () => clearInterval(interval);
    }, [enabled, prayerTimes, calculateCurrentPrayer]);

    return {
        previous: prayerState?.previous || null,
        next: prayerState?.next || null,
        progress: prayerState?.progress || 0,
        hasChanged, // Flag indicating prayer just changed
        isReady: prayerState !== null
    };
}
