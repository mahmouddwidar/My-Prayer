import "../popup/App.css";
import { useEffect } from "react";
import { DateCard } from "../components/DateCard";
import PrayerCard from "../components/PrayerCard";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useRealtimePrayerTimes } from "@/hooks/useRealtimePrayerTimes";
import PopupSkeleton from "../components/skeletons/PopupSkeleton";
import PopupError from "../components/errors/PopupError";
import { listenForThemeChanges, applyThemeToDOM } from "@/utils/themeManager";

function App() {
	const { prayerTimes, dateInfo, isLoading, error, refresh } = usePrayerTimes();

	// Use real-time prayer tracking - automatically updates when prayer changes
	const { previous, next, progress, isReady } = useRealtimePrayerTimes({
		prayerTimes,
		enabled: !isLoading && prayerTimes.length > 0,
		checkInterval: 10000, // Check for prayer changes every 10 seconds
	});

	// Listen for theme changes from other contexts
	useEffect(() => {
		const unsubscribe = listenForThemeChanges((newTheme) => {
			applyThemeToDOM(newTheme);
		}, "settings");

		return unsubscribe;
	}, []);

	if (isLoading) {
		return <PopupSkeleton />;
	}

	if (error) {
		return <PopupError msg={error.message} clickFn={refresh} />;
	}

	if (prayerTimes.length === 0) {
		return (
			<div className="min-w-75 min-h-50 flex items-center justify-center bg-white dark:bg-dark-bg text-gray-900 dark:text-text-light">
				<p>No prayer times available</p>
			</div>
		);
	}

	if (!isReady || !previous || !next) {
		return <PopupSkeleton />;
	}

	return (
		<div className="popup-container min-w-75 min-h-50 flex flex-col font-sans">
			<div className="flex flex-col min-[400px]:flex-row min-[400px]:items-stretch">
				{/* Date Section */}
				<DateCard
					weekday={dateInfo!.weekday}
					day={dateInfo!.day}
					month={dateInfo!.month}
				/>
				{/* Prayer Section - Auto-updates when prayer changes */}
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
