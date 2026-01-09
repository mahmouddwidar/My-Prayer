/**
 * Convert 24-hour time string (HH:MM) to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "05:30", "13:45", "23:15")
 * @returns Formatted time in 12-hour format (e.g., "5:30 AM", "1:45 PM", "11:15 PM")
 */
export function convertTo12HourFormat(time24: string): string {
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