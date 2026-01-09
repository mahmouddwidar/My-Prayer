import { PrayerTime } from "@/types/prayer";

export class NotificationScheduler {

    async scheduleAll(prayerTimes: PrayerTime[]) {
        // Clear existing prayer alarms
        await this.clearAll();

        const now = Date.now();

        for (const prayer of prayerTimes) {
            if (prayer.timestamp.getTime() > now) {
                await this.schedulePrayer(prayer);
            }
        }

        console.log(`Scheduled ${prayerTimes.length} prayer notifications`);
    }

    async schedulePrayer(prayer: PrayerTime) {
        const delayInMinutes = this.calculateDelayInMinutes(prayer.timestamp);

        if (delayInMinutes > 0) {
            await browser.alarms.create(`prayer-${prayer.name}`, {
                delayInMinutes,
                periodInMinutes: 24 * 60 // Repeat daily
            });

            console.log(`Scheduled ${prayer.name} in ${delayInMinutes.toFixed(1)} minutes`);
        }
    }

    async clearAll() {
        const allAlarms = await browser.alarms.getAll();

        for (const alarm of allAlarms) {
            if (alarm.name.startsWith('prayer-')) {
                await browser.alarms.clear(alarm.name);
            }
        }

        console.log('Cleared all prayer notifications');
    }

    private calculateDelayInMinutes(prayerTime: Date): number {
        const now = new Date();
        const diffMs = prayerTime.getTime() - now.getTime();
        return Math.max(0, diffMs / (1000 * 60));
    }
}