import { PrayerTime } from '@/types/prayer';
import { PrayerService } from '@/api/services/prayerService';

export class DailyUpdater {
    constructor(private prayerService: PrayerService) { }

    async scheduleDailyUpdate() {
        // Calculate time until next midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const delayInMinutes = (tomorrow.getTime() - now.getTime()) / (1000 * 60);

        await browser.alarms.create('dailyPrayerUpdate', {
            delayInMinutes,
            periodInMinutes: 24 * 60
        });

        console.log(`Daily update scheduled for ${tomorrow.toLocaleString()}`);
    }

    async updatePrayerTimes(location?: { latitude: number; longitude: number }) {
        try {
            const prayerTimes = await this.prayerService.getPrayerTimes(location, true);

            // Save updated times
            await browser.storage.local.set({
                prayerTimes,
                lastUpdated: new Date().toISOString()
            });

            console.log('Prayer times updated for new day');
            return prayerTimes;
        } catch (error) {
            console.error('Failed to update prayer times:', error);
            throw error;
        }
    }
}