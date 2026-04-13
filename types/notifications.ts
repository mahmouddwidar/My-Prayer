import { PrayerName } from '@/types/prayer';

/**
 * Notification settings structure
 * Stored in chrome.storage.local under 'notificationSettings' key
 */
export interface NotificationSettings {
    enabled: boolean;
    prayers: Record<PrayerName, boolean>;
    sound: boolean;
    vibration: boolean;
}

export interface NotificationConfig {
    prayerName: PrayerName;
    shouldNotify: boolean;
    timestamp: Date;
}

/**
 * Default notification settings
 * All prayers enabled when notifications are turned on
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    enabled: true,
    prayers: {
        Fajr: true,
        Sunrise: false,
        Dhuhr: true,
        Asr: true,
        Maghrib: true,
        Isha: true,
    },
    sound: true,
    vibration: true,
};

/**
 * Prayer names that should be notifiable
 * Excludes "Sunrise" as it's typically not a prayer
 */
export const NOTIFIABLE_PRAYERS: PrayerName[] = [
    'Fajr',
    'Dhuhr',
    'Asr',
    'Maghrib',
    'Isha',
];
