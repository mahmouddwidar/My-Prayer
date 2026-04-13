import { useState, useEffect, useCallback } from 'react';
import { PrayerName } from '@/types/prayer';
import {
    NotificationSettings,
    DEFAULT_NOTIFICATION_SETTINGS,
    NOTIFIABLE_PRAYERS,
} from '@/types/notifications';
import { NotificationService } from '@/api/services/notificationService';
import { browser } from 'wxt/browser';

/**
 * Custom hook for managing notification settings
 * Provides real-time sync across all extension pages
 * 
 * Usage:
 * const { settings, toggleMaster, togglePrayer, isLoading } = useNotificationSettings();
 */
export function useNotificationSettings() {
    const [settings, setSettings] = useState<NotificationSettings>(
        DEFAULT_NOTIFICATION_SETTINGS
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    // Listen for settings changes from other pages/windows
    useEffect(() => {
        const handleStorageChange = async (
            changes: Record<string, browser.storage.StorageChange>,
            areaName: string
        ) => {
            if (areaName !== 'local') return;

            if (changes.notificationSettings?.newValue) {
                const newSettings = changes.notificationSettings
                    .newValue as NotificationSettings;
                console.log('📢 Notification settings updated from storage:', newSettings);
                setSettings(newSettings);
            }
        };

        // Listen for storage changes
        browser.storage.onChanged.addListener(handleStorageChange);

        // Also listen for messages from background script
        const handleMessage = (message: any) => {
            if (message.type === 'NOTIFICATION_SETTINGS_CHANGED') {
                console.log('📢 Notification settings updated from message:', message.settings);
                setSettings(message.settings);
            }
        };

        browser.runtime.onMessage.addListener(handleMessage);

        return () => {
            browser.storage.onChanged.removeListener(handleStorageChange);
            browser.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

    const loadSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            const loaded = await NotificationService.getSettings();
            setSettings(loaded);
            setError(null);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to load settings');
            setError(error);
            console.error('Failed to load notification settings:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const toggleMaster = useCallback(async (enabled: boolean) => {
        try {
            const updated = await NotificationService.toggleMaster(enabled);
            setSettings(updated);
            setError(null);

            // Notify background to reschedule alarms
            browser.runtime.sendMessage({
                type: 'RESCHEDULE_ALARMS',
            }).catch(() => {
                // Background script may not be listening
            });

            return updated;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to update setting');
            setError(error);
            console.error('Failed to toggle master notification:', error);
            throw error;
        }
    }, []);

    const togglePrayer = useCallback(async (prayerName: PrayerName, enabled: boolean) => {
        try {
            const updated = await NotificationService.togglePrayer(prayerName, enabled);
            setSettings(updated);
            setError(null);

            // Notify background to reschedule alarms
            browser.runtime.sendMessage({
                type: 'RESCHEDULE_ALARMS',
            }).catch(() => {
                // Background script may not be listening
            });

            return updated;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to update setting');
            setError(error);
            console.error(`Failed to toggle notification for ${prayerName}:`, error);
            throw error;
        }
    }, []);

    return {
        settings,
        notifiablePrayers: NOTIFIABLE_PRAYERS,
        toggleMaster,
        togglePrayer,
        isLoading,
        error,
        isEnabled: (prayerName: PrayerName) => settings.prayers[prayerName],
    };
}
