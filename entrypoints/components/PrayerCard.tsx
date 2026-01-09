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
	progress,
}: PrayerCardProps) {
	const prevPrayerTime = convertTo12HourFormat(prevPrayer.time);
	const nextPrayerTime = convertTo12HourFormat(nextPrayer.time);

	return (
		<div className="p-4 bg-dark-surface bg-linear-180 from-offwhite-light to-dark-surface shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
			{/* Prayer Titles */}
			<div className="flex justify-between items-center pb-2">
				<h3 className="text-lg font-medium">
					{prevPrayer.name ?? "Loading..."}
				</h3>
				<h3 className="text-lg font-medium">
					{nextPrayer.name ?? "Loading..."}
				</h3>
			</div>

			{/* Progress Bar */}
			<ProgressBar previousPrayerTime={parseTimeToDate(prevPrayer.time)} nextPrayerTime={parseTimeToDate(nextPrayer.time)} />

			{/* Prayer Times */}
			<div className="pt-4 flex justify-between items-center">
				<h3 className="text-lg font-medium">
					{prevPrayerTime ?? "Loading..."}
				</h3>
				<h3 className="text-lg font-medium">
					{nextPrayerTime ?? "Loading..."}
				</h3>
			</div>
		</div>
	);
}
