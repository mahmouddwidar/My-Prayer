import "../popup/App.css";
import { DateCard } from "../components/DateCard";
import PrayerCard from "../components/PrayerCard";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { findNextPrayer } from "@/utils/prayerUtils";

function App() {
	const { prayerTimes, dateInfo, isLoading, error, refresh } = usePrayerTimes();
	console.log(dateInfo);

	if (isLoading) {
		return (
			<div className="min-w-75 min-h-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-text-light">Loading prayer times...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-w-75 min-h-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-400">Error: {error.message}</p>
					<button
						onClick={refresh}
						className="mt-4 px-4 py-2 bg-primary text-black rounded-lg"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	if (prayerTimes.length === 0) {
		return (
			<div className="min-w-75 min-h-50 flex items-center justify-center">
				<p className="text-text-light">No prayer times available</p>
			</div>
		);
	}

	const { previous, next, progress } = findNextPrayer(prayerTimes);

	return (
		<div className="min-w-75 min-h-50 bg-dark-bg text-text-light font-sans">
			<div className="flex flex-col min-[400px]:flex-row min-[400px]:items-stretch">
				{/* Date Section */}
				{/* TODO: Check on the dateInfo Type here */}
				<DateCard
					weekday={dateInfo!.weekday}
					day={dateInfo!.day}
					month={dateInfo!.month}
				/>
				{/* Prayer Section */}
				<PrayerCard
					prevPrayer={previous}
					nextPrayer={next}
					progress={progress}
				/>
			</div>
		</div>
	);
}

export default App;
