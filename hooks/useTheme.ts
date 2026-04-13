import { useState, useEffect, useCallback } from 'react';
import {
    ThemeType,
    getThemeFromStorage,
    saveThemeToStorage,
    applyThemeToDOM,
    listenForThemeChanges
} from '@/utils/themeManager';

interface UseThemeReturn {
    /**
     * Current theme ('light' or 'dark')
     */
    theme: ThemeType;

    /**
     * Whether theme is still loading from storage
     */
    isLoading: boolean;

    /**
     * Error occurred while loading/saving theme
     */
    error: Error | null;

    /**
     * Change theme and save to storage
     */
    setTheme: (theme: ThemeType) => Promise<void>;

    /**
     * Toggle between light and dark
     */
    toggleTheme: () => Promise<void>;
}

/**
 * Custom hook for managing theme across the extension
 * 
 * Usage:
 * ```tsx
 * const { theme, setTheme, toggleTheme } = useTheme();
 * 
 * return (
 *   <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *     Toggle Theme
 *   </button>
 * );
 * ```
 */
export function useTheme(storageKey: string = 'settings'): UseThemeReturn {
    const [theme, setThemeState] = useState<ThemeType>('light');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Load theme on mount
    useEffect(() => {
        const loadTheme = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const storedTheme = await getThemeFromStorage(storageKey);
                setThemeState(storedTheme);
                applyThemeToDOM(storedTheme);
            } catch (err) {
                const errorObj = err instanceof Error ? err : new Error('Failed to load theme');
                setError(errorObj);
                console.error('Theme loading error:', errorObj);
            } finally {
                setIsLoading(false);
            }
        };

        loadTheme();
    }, [storageKey]);

    // Listen for theme changes from other contexts
    useEffect(() => {
        const unsubscribe = listenForThemeChanges((newTheme) => {
            setThemeState(newTheme);
        }, storageKey);

        return unsubscribe;
    }, [storageKey]);

    // Handle theme change
    const handleSetTheme = useCallback(
        async (newTheme: ThemeType) => {
            setError(null);

            try {
                await saveThemeToStorage(newTheme, storageKey);
                setThemeState(newTheme);
                applyThemeToDOM(newTheme);
            } catch (err) {
                const errorObj = err instanceof Error ? err : new Error('Failed to save theme');
                setError(errorObj);
                console.error('Theme save error:', errorObj);
                throw errorObj;
            }
        },
        [storageKey]
    );

    // Handle toggle
    const handleToggleTheme = useCallback(async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        await handleSetTheme(newTheme);
    }, [theme, handleSetTheme]);

    return {
        theme,
        isLoading,
        error,
        setTheme: handleSetTheme,
        toggleTheme: handleToggleTheme
    };
}
