import { PrayerTime, PrayerName } from '../types/prayer';

export function parseTimeToDate(timeString: string): Date {
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);

    const date = new Date();

    let adjustedHours = hours;
    if (period === 'PM' && hours < 12) adjustedHours += 12;
    if (period === 'AM' && hours === 12) adjustedHours = 0;

    date.setHours(adjustedHours, minutes, 0, 0);
    return date;
}

export function findNextPrayer(prayerTimes: PrayerTime[]): {
    previous: PrayerTime;
    next: PrayerTime;
    progress: number;
} {
    const now = new Date();
    let nextIndex = -1;

    // Find the next prayer
    for (let i = 0; i < prayerTimes.length; i++) {
        if (prayerTimes[i].timestamp > now) {
            nextIndex = i;
            break;
        }
    }

    // If no next prayer (it's after Isha), use Fajr tomorrow
    if (nextIndex === -1) {
        nextIndex = 0;
    }

    const previousIndex = nextIndex === 0 ? prayerTimes.length - 1 : nextIndex - 1;

    const previousPrayer = prayerTimes[previousIndex];
    const nextPrayer = prayerTimes[nextIndex];

    // Calculate progress
    const totalDuration = nextPrayer.timestamp.getTime() - previousPrayer.timestamp.getTime();
    const elapsed = now.getTime() - previousPrayer.timestamp.getTime();
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    return {
        previous: previousPrayer,
        next: nextPrayer,
        progress
    };
}