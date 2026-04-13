import ProgressBar from "./ProgressBar";

interface Prayer {
	name: string;
	time: string;
}

interface PrayerCardProps {
	prevPrayer: Prayer;
	nextPrayer: Prayer;
	progress: number;
}

export default function PrayerCard({
	prevPrayer,
	nextPrayer,
}: PrayerCardProps) {
	const prevPrayerTime = convertTo12HourFormat(prevPrayer.time);
	const nextPrayerTime = convertTo12HourFormat(nextPrayer.time);

	return (
		<div className="p-4 prayer-card">
			{/* Prayer Titles */}
			<div className="flex justify-between items-center pb-2">
				<h3 className="text-lg font-medium text-gray-900 dark:text-text-light">
					{prevPrayer.name ?? "Loading..."}
				</h3>
				<h3 className="text-lg font-medium text-gray-900 dark:text-text-light">
					{nextPrayer.name ?? "Loading..."}
				</h3>
			</div>

			{/* Progress Bar */}
			<ProgressBar
				previousPrayerTime={parseTimeToDate(prevPrayer.time)}
				nextPrayerTime={parseTimeToDate(nextPrayer.time)}
			/>

			{/* Prayer Times */}
			<div className="pt-4 flex justify-between items-center">
				<h3 className="text-lg font-medium text-gray-900 dark:text-text-light">
					{prevPrayerTime ?? "Loading..."}
				</h3>
				<h3 className="text-lg font-medium text-gray-900 dark:text-text-light">
					{nextPrayerTime ?? "Loading..."}
				</h3>
			</div>
		</div>
	);
}
