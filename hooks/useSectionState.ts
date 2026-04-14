import { useState, useEffect, useCallback } from 'react';

interface UseSectionStateReturn {
    expandedSections: Set<string>;
    toggleSection: (sectionId: string) => void;
    isExpanded: (sectionId: string) => boolean;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Hook for managing section collapse/expand state with persistent storage
 * 
 * Usage:
 * ```tsx
 * const { isExpanded, toggleSection } = useSectionState();
 * 
 * return (
 *   <>
 *     <button onClick={() => toggleSection('prayers')}>
 *       {isExpanded('prayers') ? '▼' : '▶'} Prayer Times
 *     </button>
 *     {isExpanded('prayers') && <PrayerList />}
 *   </>
 * );
 * ```
 */
export function useSectionState(): UseSectionStateReturn {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const STORAGE_KEY = 'sectionStates';

    // Load section states from storage on mount
    useEffect(() => {
        const loadSectionStates = async () => {
            try {
                const result = await browser.storage.local.get(STORAGE_KEY);
                const storedStates = result[STORAGE_KEY];

                if (storedStates) {
                    // Convert object to Set (only include expanded sections)
                    const expanded = new Set<string>();
                    Object.entries(storedStates).forEach(([sectionId, state]) => {
                        if (state === 'open') {
                            expanded.add(sectionId);
                        }
                    });
                    setExpandedSections(expanded);
                } else {
                    // Default: all sections expanded
                    setExpandedSections(new Set(['prayerTimesHeader', 'azkarHeader']));
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to load section states'));
                console.error('Failed to load section states:', err);
                // Default to expanded if error
                setExpandedSections(new Set(['prayerTimesHeader', 'azkarHeader']));
            } finally {
                setIsLoading(false);
            }
        };

        loadSectionStates();
    }, []);

    // Save section states to storage
    const saveSectionStates = useCallback(async (states: Set<string>) => {
        try {
            // Convert Set to object for storage
            const statesObj: Record<string, string> = {};

            // Get all known section IDs and mark their state
            const allSectionIds = ['prayerTimesHeader', 'azkarHeader'];
            allSectionIds.forEach(sectionId => {
                statesObj[sectionId] = states.has(sectionId) ? 'open' : 'collapsed';
            });

            await browser.storage.local.set({
                [STORAGE_KEY]: statesObj
            });
        } catch (err) {
            console.error('Failed to save section states:', err);
        }
    }, []);

    // Toggle section expanded/collapsed state
    const toggleSection = useCallback((sectionId: string) => {
        setExpandedSections(prev => {
            const updated = new Set(prev);
            if (updated.has(sectionId)) {
                updated.delete(sectionId);
            } else {
                updated.add(sectionId);
            }
            saveSectionStates(updated);
            return updated;
        });
    }, [saveSectionStates]);

    // Check if section is expanded
    const isExpanded = useCallback((sectionId: string) => {
        return expandedSections.has(sectionId);
    }, [expandedSections]);

    return {
        expandedSections,
        toggleSection,
        isExpanded,
        isLoading,
        error
    };
}
