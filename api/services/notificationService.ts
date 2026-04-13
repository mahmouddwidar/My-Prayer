import { PrayerTime, PrayerName } from '@/types/prayer';
import {
    NotificationSettings,
    DEFAULT_NOTIFICATION_SETTINGS,
    NOTIFIABLE_PRAYERS,
} from '@/types/notifications';
import { browser } from 'wxt/browser';

/**
 * NotificationService manages all notification logic:
 * - Loads and saves user preferences
 * - Filters prayers based on user settings
 * - Shows browser notifications
 * - Handles notification events
 */
export class NotificationService {
    private static readonly STORAGE_KEY = 'notificationSettings';
    private static readonly ALARM_PREFIX = 'prayer-';

    /**
     * Get current notification settings from storage
     * Returns defaults if not found
     */
    static async getSettings(): Promise<NotificationSettings> {
        try {
            const result = await browser.storage.local.get(this.STORAGE_KEY);
            return result[this.STORAGE_KEY] || DEFAULT_NOTIFICATION_SETTINGS;
        } catch (error) {
            console.error('Failed to load notification settings:', error);
            return DEFAULT_NOTIFICATION_SETTINGS;
        }
    }

    /**
     * Save notification settings to storage
     */
    static async saveSettings(settings: NotificationSettings): Promise<void> {
        try {
            await browser.storage.local.set({
                [this.STORAGE_KEY]: settings,
            });
            console.log('✅ Notification settings saved:', settings);

            // Broadcast to all pages that settings changed
            browser.runtime.sendMessage({
                type: 'NOTIFICATION_SETTINGS_CHANGED',
                settings,
            }).catch(() => {
                // Ignore errors if no listener (e.g., background script)
            });
        } catch (error) {
            console.error('Failed to save notification settings:', error);
        }
    }

    /**
     * Toggle master notification switch
     */
    static async toggleMaster(enabled: boolean): Promise<NotificationSettings> {
        const settings = await this.getSettings();
        settings.enabled = enabled;
        await this.saveSettings(settings);
        return settings;
    }

    /**
     * Toggle notification for a specific prayer
     */
    static async togglePrayer(
        prayerName: PrayerName,
        enabled: boolean
    ): Promise<NotificationSettings> {
        const settings = await this.getSettings();
        settings.prayers[prayerName] = enabled;
        await this.saveSettings(settings);
        return settings;
    }

    /**
     * Check if notifications are enabled for a specific prayer
     */
    static async shouldNotify(prayerName: PrayerName): Promise<boolean> {
        const settings = await this.getSettings();
        return settings.enabled && settings.prayers[prayerName];
    }

    /**
     * Filter prayers based on notification settings
     * Returns only prayers that should trigger notifications
     */
    static async filterPrayersForNotification(
        prayers: PrayerTime[]
    ): Promise<PrayerTime[]> {
        const settings = await this.getSettings();

        if (!settings.enabled) {
            return [];
        }

        return prayers.filter(
            (prayer) =>
                NOTIFIABLE_PRAYERS.includes(prayer.name) &&
                settings.prayers[prayer.name]
        );
    }

    /**
     * Show a browser notification for a prayer
     */
    static async showNotification(prayerName: string): Promise<void> {
        try {
            const settings = await this.getSettings();

            // Don't show if notifications are disabled
            if (!settings.enabled) {
                console.log('🔕 Notifications disabled, skipping notification');
                return;
            }

            const notificationId = `prayer-${Date.now()}`;

            await browser.notifications.create(notificationId, {
                type: 'basic',
                iconUrl: browser.runtime.getURL('public/icon/icon-128.png'),
                title: `🕌 ${prayerName} Prayer Time`,
                message: `It's time for ${prayerName} prayer`,
                priority: 2,
                requireInteraction: false,
                buttons: [{ title: 'Open Prayer Times' }],
            });

            // Play notification sound if enabled
            if (settings.sound) {
                this.playNotificationSound();
            }

            // Vibrate if enabled
            if (settings.vibration && 'vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }

            console.log(`🔔 Notification shown for ${prayerName}`);

            // Handle notification click
            browser.notifications.onClicked.addListener((clickedId: string) => {
                if (clickedId === notificationId) {
                    browser.action.openPopup();
                    browser.notifications.clear(notificationId);
                }
            });

            browser.notifications.onButtonClicked.addListener(
                (clickedId: string, buttonIndex: number) => {
                    if (clickedId === notificationId && buttonIndex === 0) {
                        browser.action.openPopup();
                        browser.notifications.clear(notificationId);
                    }
                }
            );

            // Auto-clear notification after 10 seconds
            setTimeout(() => {
                browser.notifications.clear(notificationId).catch(() => {
                    // Notification already cleared
                });
            }, 10000);
        } catch (error) {
            console.error(`Failed to show notification for ${prayerName}:`, error);
        }
    }

    /**
     * Play a notification sound
     */
    private static playNotificationSound(): void {
        try {
            const audioContext = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Double beep sound
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + 0.1
            );

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);

            // Second beep
            const osc2 = audioContext.createOscillator();
            osc2.connect(gainNode);
            osc2.frequency.value = 800;
            osc2.start(audioContext.currentTime + 0.2);
            osc2.stop(audioContext.currentTime + 0.3);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + 0.3
            );
        } catch (error) {
            console.debug('Could not play notification sound:', error);
        }
    }

    /**
     * Request notification permission from user
     */
    static async requestPermission(): Promise<NotificationPermission> {
        return await Notification.requestPermission();
    }

    /**
     * Get the alarm name for a prayer
     */
    static getAlarmName(prayerName: string): string {
        return `${this.ALARM_PREFIX}${prayerName}`;
    }

    /**
     * Check if an alarm name is a prayer alarm
     */
    static isPrayerAlarm(alarmName: string): boolean {
        return alarmName.startsWith(this.ALARM_PREFIX);
    }

    /**
     * Extract prayer name from alarm name
     */
    static getPrayerNameFromAlarm(alarmName: string): string {
        return alarmName.replace(this.ALARM_PREFIX, '');
    }
}
