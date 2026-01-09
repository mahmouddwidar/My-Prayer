export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface PrayerTime {
    name: PrayerName;
    time: string; // "5:30 AM"
    timestamp: Date;
    arabicName?: string;
}

export interface DateInfo {
    weekday: string;
    day: string;
    month: string;
}

export interface PrayerData {
    timings: Record<PrayerName, string>;
    date: {
        hijri: {
            day: string;
            month: { en: string };
        };
        gregorian: {
            weekday: { en: string };
        };
    };
};

export interface ApiResponse<T = any> {
    code: number;
    status: string;
    data: T;
}