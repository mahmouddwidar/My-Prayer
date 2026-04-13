import { PrayerTime } from "@/types/prayer";
import { NotificationService } from "@/api/services/notificationService";
import { browser } from 'wxt/browser';

/**
 * NotificationScheduler handles scheduling prayer alarms
 * Works with NotificationService to respect user preferences
 * 
 * Key features:
 * - Only schedules alarms for prayers user wants notifications for
 * - Prevents duplicate alarms
 * - Auto-clears past prayer alarms
 * - Respects master notification toggle
 */
export class NotificationScheduler {
    /**
     * Schedule all prayers that have notifications enabled
     * Automatically filters based on user settings
     */
    async scheduleAll(prayerTimes: PrayerTime[]): Promise<void> {
        // Clear existing prayer alarms to prevent duplicates
        await this.clearAll();

        // Get user's notification preferences
        const prayersToNotify = await NotificationService.filterPrayersForNotification(prayerTimes);

        if (prayersToNotify.length === 0) {
            console.log('🔕 No prayers to schedule (notifications disabled or no prayers selected)');
            return;
        }

        const now = Date.now();

        for (const prayer of prayersToNotify) {
            if (prayer.timestamp.getTime() > now) {
                await this.schedulePrayer(prayer);
            }
        }

        console.log(`✅ Scheduled ${prayersToNotify.length} prayer alarms`);
    }

    /**
     * Schedule a single prayer alarm
     */
    async schedulePrayer(prayer: PrayerTime): Promise<void> {
        const delayInMinutes = this.calculateDelayInMinutes(prayer.timestamp);

        if (delayInMinutes > 0) {
            const alarmName = NotificationService.getAlarmName(prayer.name);

            try {
                await browser.alarms.create(alarmName, {
                    delayInMinutes,
                    periodInMinutes: 24 * 60 // Repeat daily
                });

                console.log(`⏰ Scheduled ${prayer.name} in ${delayInMinutes.toFixed(1)} minutes`);
            } catch (error) {
                console.error(`Failed to schedule ${prayer.name}:`, error);
            }
        }
    }

    /**
     * Remove all prayer alarms
     * Safe to call even if no alarms exist
     */
    async clearAll(): Promise<void> {
        try {
            const allAlarms = await browser.alarms.getAll();
            const prayerAlarms = allAlarms.filter(alarm =>
                NotificationService.isPrayerAlarm(alarm.name)
            );

            for (const alarm of prayerAlarms) {
                await browser.alarms.clear(alarm.name);
            }

            if (prayerAlarms.length > 0) {
                console.log(`🗑️ Cleared ${prayerAlarms.length} prayer alarms`);
            }
        } catch (error) {
            console.error('Failed to clear alarms:', error);
        }
    }

    /**
     * Clear a specific prayer alarm
     */
    async clearPrayer(prayerName: string): Promise<void> {
        const alarmName = NotificationService.getAlarmName(prayerName);
        try {
            await browser.alarms.clear(alarmName);
            console.log(`🗑️ Cleared alarm for ${prayerName}`);
        } catch (error) {
            console.error(`Failed to clear alarm for ${prayerName}:`, error);
        }
    }

    /**
     * Reschedule all alarms based on new prayer times
     * Called when prayer times are updated (daily or manually)
     */
    async rescheduleAll(prayerTimes: PrayerTime[]): Promise<void> {
        console.log('🔄 Rescheduling all prayer alarms...');
        await this.scheduleAll(prayerTimes);
    }

    /**
     * Calculate delay in minutes until prayer time
     * Returns 0 if time is in the past
     */
    private calculateDelayInMinutes(prayerTime: Date): number {
        const now = new Date();
        const diffMs = prayerTime.getTime() - now.getTime();
        return Math.max(0, diffMs / (1000 * 60));
    }
}