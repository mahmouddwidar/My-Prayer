// Common utility functions for My Prayer extension

// Time and Date Utilities
export function convertTo12HourFormat(time24) {
    const [hours, minutes] = time24.split(":");
    let period = "AM";
    let hour = parseInt(hours);

    if (hour >= 12) {
        period = "PM";
    }
    if (hour === 0) {
        hour = 12;
    } else if (hour > 12) {
        hour -= 12;
    }

    return `${hour}:${minutes.padStart(2, "0")} ${period}`;
}

export function parseTimeToDate(time) {
    const [timeString, period] = time.split(" ");
    const [hours, minutes] = timeString.split(":");
    let hour = parseInt(hours);
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    const date = new Date();
    date.setHours(hour, parseInt(minutes), 0, 0);

    return date;
}

export function getCurrentDateString() {
    return new Date().toDateString();
}

export function getNextMidnight() {
    const now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
    );
}

// Prayer Method Utilities
export function getMethodByCountry(countryCode) {
    const methods = {
        AE: 16,
        EG: 5,
        IN: 1,
        IQ: 3,
        IR: 7,
        KW: 9,
        MY: 3,
        PK: 1,
        QA: 10,
        SA: 4,
        SG: 11,
        TR: 13,
        US: 2,
        FR: 12,
        RU: 14,
    };
    return methods[countryCode] || 3; // Default to Muslim World League
}

// Storage Utilities
export async function getStorageData(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, resolve);
    });
}

export async function setStorageData(data) {
    return new Promise((resolve) => {
        chrome.storage.local.set(data, resolve);
    });
}

export async function getTimings() {
    const result = await getStorageData(["timings"]);
    return result.timings;
}

export async function getLocationData() {
    const result = await getStorageData(["latitude", "longitude"]);
    return {
        latitude: result.latitude,
        longitude: result.longitude
    };
}

export async function getOptions() {
    const result = await getStorageData(["options"]);
    return result.options || {};
}

// Prayer Time Utilities
export function createPrayerTimesArray(timings) {
    return [
        { name: "Fajr", time: timings.Fajr },
        { name: "Sunrise", time: timings.Sunrise },
        { name: "Dhuhr", time: timings.Dhuhr },
        { name: "Asr", time: timings.Asr },
        { name: "Maghrib", time: timings.Maghrib },
        { name: "Isha", time: timings.Isha },
    ];
}

export function findNextPrayer(prayerTimes) {
    const currentTime = new Date();
    let nextPrayer, previousPrayer;

    for (let i = 0; i < prayerTimes.length; i++) {
        const prayerDate = parseTimeToDate(prayerTimes[i].time);
        if (currentTime < prayerDate) {
            nextPrayer = prayerTimes[i];
            previousPrayer =
                i === 0 ? prayerTimes[prayerTimes.length - 1] : prayerTimes[i - 1];
            break;
        }
    }

    if (!nextPrayer) {
        nextPrayer = prayerTimes[0];
        previousPrayer = prayerTimes[prayerTimes.length - 1];
    }

    return { nextPrayer, previousPrayer };
}

// Notification Utilities
export function showPrayerNotification(prayerName) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "./imgs/icon-64.png",
        title: "Prayer Reminder",
        message: `It's time for ${prayerName} prayer.`,
        priority: 2,
    });
}

export async function requestNotificationPermission() {
    if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }
    return true;
}

// Alarm Utilities
export function schedulePrayerAlarm(prayer, timestamp) {
    chrome.alarms.create(`prayer-${prayer}`, { when: timestamp });
    console.log(`Alarm set for ${prayer} at ${new Date(timestamp)}`);
}

export function scheduleDailyAlarm() {
    const nextMidnight = getNextMidnight();
    chrome.alarms.create("dailyPrayerUpdate", {
        when: nextMidnight.getTime(),
        periodInMinutes: 24 * 60,
    });
}

export async function clearPrayerAlarms() {
    const allAlarms = await chrome.alarms.getAll();
    const prayerAlarms = allAlarms.filter(
        (alarm) =>
            alarm.name.startsWith("prayer-") && alarm.name !== "dailyPrayerUpdate"
    );

    for (const alarm of prayerAlarms) {
        await chrome.alarms.clear(alarm.name);
    }
}

// Progress Bar Utilities
export function updateProgressBar(currentTime, nextPrayerTime, previousPrayerTime, progressBarElement) {
    let timeDiff = nextPrayerTime - currentTime;
    let totalTime = nextPrayerTime - previousPrayerTime;

    // Adjust totalTime for overnight prayer times
    if (totalTime < 0) {
        totalTime += 24 * 60 * 60 * 1000;
        if (currentTime > nextPrayerTime) {
            timeDiff += 24 * 60 * 60 * 1000;
        }
    }

    const progress = 100 - (timeDiff / totalTime) * 100;
    progressBarElement.style.width = `${progress}%`;

    const totalSeconds = Math.floor(timeDiff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let timeText = "";
    if (hours > 0) {
        timeText = `${hours} hr${hours > 1 ? "s" : ""} ${minutes} min${minutes > 1 ? "s" : ""}`;
    } else if (minutes > 0) {
        timeText = `${minutes} min${minutes > 1 ? "s" : ""}`;
    } else {
        timeText = `${seconds} sec${seconds > 1 ? "s" : ""}`;
    }

    progressBarElement.textContent = timeText;
    progressBarElement.setAttribute("title", timeText);

    // Update background element if it exists
    const backgroundElement = progressBarElement.parentElement;
    if (backgroundElement) {
        backgroundElement.setAttribute("title", timeText);
    }

    return timeText;
}

// Error Handling Utilities
export function handleError(error, context = "") {
    console.error(`Error in ${context}:`, error);
}

// Validation Utilities
export function isValidLocation(latitude, longitude) {
    return latitude && longitude &&
        !isNaN(latitude) && !isNaN(longitude) &&
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180;
}

export function isValidTimeFormat(time) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
} 