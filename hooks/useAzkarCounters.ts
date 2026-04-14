import { useState, useEffect, useCallback } from 'react';

export interface AzkarCounter {
    id: string;
    currentCount: number;
    originalCount: number;
}

interface UseAzkarCountersReturn {
    counters: Map<string, AzkarCounter>;
    increment: (id: string) => void;
    decrement: (id: string) => void;
    reset: (id: string) => void;
    resetAll: () => void;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Hook for managing Azkar counter state with persistent storage
 * 
 * Usage:
 * ```tsx
 * const { counters, increment, reset } = useAzkarCounters();
 * 
 * return (
 *   <div>
 *     <button onClick={() => increment('azkar-01')}>+</button>
 *     <span>{counters.get('azkar-01')?.currentCount}</span>
 *     <button onClick={() => reset('azkar-01')}>Reset</button>
 *   </div>
 * );
 * ```
 */
export function useAzkarCounters(): UseAzkarCountersReturn {
    const [counters, setCounters] = useState<Map<string, AzkarCounter>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const STORAGE_KEY = 'azkarCounters';

    // Load counters from storage on mount
    useEffect(() => {
        const loadCounters = async () => {
            try {
                const result = await browser.storage.local.get(STORAGE_KEY);
                const storedCounters = result[STORAGE_KEY];

                if (storedCounters) {
                    // Convert plain object to Map
                    const countersMap = new Map(Object.entries(storedCounters));
                    setCounters(countersMap);
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to load counters'));
                console.error('Failed to load azkar counters:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadCounters();
    }, []);

    // Save counters to storage (debounced via useCallback)
    const saveCounters = useCallback(async (newCounters: Map<string, AzkarCounter>) => {
        try {
            // Convert Map to object for storage
            const countersObj = Object.fromEntries(newCounters);
            await browser.storage.local.set({
                [STORAGE_KEY]: countersObj
            });
        } catch (err) {
            console.error('Failed to save azkar counters:', err);
        }
    }, []);

    // Initialize counter if not exists
    const ensureCounterExists = useCallback((id: string, originalCount: number) => {
        if (!counters.has(id)) {
            setCounters(prev => {
                const updated = new Map(prev);
                updated.set(id, {
                    id,
                    currentCount: originalCount,
                    originalCount
                });
                return updated;
            });
        }
    }, [counters]);

    // Increment counter
    const increment = useCallback((id: string) => {
        setCounters(prev => {
            const updated = new Map(prev);
            const counter = updated.get(id);

            if (counter && counter.currentCount > 0) {
                updated.set(id, {
                    ...counter,
                    currentCount: counter.currentCount - 1
                });
                saveCounters(updated);
            }

            return updated;
        });
    }, [saveCounters]);

    // Decrement counter (rarely used, but useful for corrections)
    const decrement = useCallback((id: string) => {
        setCounters(prev => {
            const updated = new Map(prev);
            const counter = updated.get(id);

            if (counter && counter.currentCount < counter.originalCount) {
                updated.set(id, {
                    ...counter,
                    currentCount: counter.currentCount + 1
                });
                saveCounters(updated);
            }

            return updated;
        });
    }, [saveCounters]);

    // Reset single counter to original value
    const reset = useCallback((id: string) => {
        setCounters(prev => {
            const updated = new Map(prev);
            const counter = updated.get(id);

            if (counter) {
                updated.set(id, {
                    ...counter,
                    currentCount: counter.originalCount
                });
                saveCounters(updated);
            }

            return updated;
        });
    }, [saveCounters]);

    // Reset all counters to original values
    const resetAll = useCallback(() => {
        setCounters(prev => {
            const updated = new Map();
            prev.forEach((counter, id) => {
                updated.set(id, {
                    ...counter,
                    currentCount: counter.originalCount
                });
            });
            saveCounters(updated);
            return updated;
        });
    }, [saveCounters]);

    return {
        counters,
        increment,
        decrement,
        reset,
        resetAll,
        isLoading,
        error
    };
}
