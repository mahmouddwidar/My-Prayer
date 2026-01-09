export interface ProgressResult {
    progress: number; // 0-100
    timeRemaining: string; // "2h 15m", "45s", "Now"
    hours: number;
    minutes: number;
    seconds: number;
}

/**
 * Calculate progress between two prayer times with overnight handling
 */
export function calculateProgress(
    previousPrayerTime: Date,
    nextPrayerTime: Date,
    currentTime: Date = new Date()
): ProgressResult {
    const nowMs = currentTime.getTime();
    const nextMs = nextPrayerTime.getTime();
    const prevMs = previousPrayerTime.getTime();

    let timeDiff = nextMs - nowMs;
    let totalTime = nextMs - prevMs;

    // Handle overnight prayers (e.g., Fajr after Isha)
    if (totalTime < 0) {
        totalTime += 24 * 60 * 60 * 1000; // Add 24 hours
        if (nowMs > nextMs) {
            timeDiff += 24 * 60 * 60 * 1000;
        }
    }

    // Calculate progress (0-100%)
    const progressValue = totalTime > 0
        ? 100 - (timeDiff / totalTime) * 100
        : 100;

    const progress = Math.min(100, Math.max(0, progressValue));

    // Calculate time components
    const totalSeconds = Math.floor(Math.max(0, timeDiff) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format time remaining string
    let timeRemaining = "Now";
    if (hours > 0) {
        timeRemaining = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        timeRemaining = `${minutes}m ${seconds}s`;
    } else if (seconds > 0) {
        timeRemaining = `${seconds}s`;
    }

    return {
        progress,
        timeRemaining,
        hours,
        minutes,
        seconds
    };
}

/**
 * Format time for display
 */
export function formatPrayerTime(date: Date): string {
    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}