/**
 * Theme Manager - Centralized theme handling for Chrome extension
 * Provides utilities for theme initialization, application, and persistence
 */

export type ThemeType = 'light' | 'dark';

export interface ThemeConfig {
    defaultTheme: ThemeType;
    storageKey: string;
}

const DEFAULT_CONFIG: ThemeConfig = {
    defaultTheme: 'light',
    storageKey: 'settings'
};

/**
 * Apply theme to document element
 * Uses class-based approach for better CSS targeting
 */
export function applyThemeToDOM(theme: ThemeType): void {
    const htmlElement = document.documentElement;

    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        htmlElement.style.colorScheme = 'dark';
    } else {
        htmlElement.classList.remove('dark');
        htmlElement.style.colorScheme = 'light';
    }

    console.log(`✓ Theme applied: ${theme}`);
}

/**
 * Get current theme from storage
 * Falls back to default if not set
 */
export async function getThemeFromStorage(
    storageKey: string = DEFAULT_CONFIG.storageKey
): Promise<ThemeType> {
    try {
        const result = await browser.storage.local.get(storageKey);
        const settings = result[storageKey];

        if (settings && settings.theme && ['light', 'dark'].includes(settings.theme)) {
            return settings.theme as ThemeType;
        }
    } catch (error) {
        console.error('Failed to get theme from storage:', error);
    }

    return DEFAULT_CONFIG.defaultTheme;
}

/**
 * Save theme to storage
 */
export async function saveThemeToStorage(
    theme: ThemeType,
    storageKey: string = DEFAULT_CONFIG.storageKey
): Promise<void> {
    try {
        // Get current settings to preserve other values
        const result = await browser.storage.local.get(storageKey);
        const currentSettings = result[storageKey] || {};

        const updatedSettings = {
            ...currentSettings,
            theme
        };

        await browser.storage.local.set({
            [storageKey]: updatedSettings
        });

        console.log(`✓ Theme saved to storage: ${theme}`);
    } catch (error) {
        console.error('Failed to save theme to storage:', error);
        throw error;
    }
}

/**
 * Initialize theme on page load
 * Applies the stored theme to DOM
 */
export async function initializeTheme(
    storageKey: string = DEFAULT_CONFIG.storageKey
): Promise<ThemeType> {
    try {
        const theme = await getThemeFromStorage(storageKey);
        applyThemeToDOM(theme);
        return theme;
    } catch (error) {
        console.error('Failed to initialize theme:', error);
        // Fall back to default
        applyThemeToDOM(DEFAULT_CONFIG.defaultTheme);
        return DEFAULT_CONFIG.defaultTheme;
    }
}

/**
 * Listen for theme changes from other contexts
 * Returns unsubscribe function
 */
export function listenForThemeChanges(
    callback: (theme: ThemeType) => void,
    storageKey: string = DEFAULT_CONFIG.storageKey
): () => void {
    const handleStorageChange = (
        changes: { [key: string]: browser.storage.StorageChange },
        areaName: string
    ) => {
        if (areaName !== 'local') return;

        const settingsChange = changes[storageKey];
        if (settingsChange && settingsChange.newValue?.theme) {
            const newTheme = settingsChange.newValue.theme as ThemeType;
            console.log(`\u{1F503} Theme change detected: ${newTheme}`); // 🔄
            callback(newTheme);
            applyThemeToDOM(newTheme);
        }
    };

    browser.storage.onChanged.addListener(handleStorageChange);

    // Return unsubscribe function
    return () => {
        browser.storage.onChanged.removeListener(handleStorageChange);
    };
}

/**
 * Toggle between light and dark themes
 */
export async function toggleTheme(
    storageKey: string = DEFAULT_CONFIG.storageKey
): Promise<ThemeType> {
    try {
        const currentTheme = await getThemeFromStorage(storageKey);
        const newTheme: ThemeType = currentTheme === 'light' ? 'dark' : 'light';

        await saveThemeToStorage(newTheme, storageKey);
        applyThemeToDOM(newTheme);

        return newTheme;
    } catch (error) {
        console.error('Failed to toggle theme:', error);
        throw error;
    }
}
