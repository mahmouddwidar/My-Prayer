import React, { useMemo, useEffect, useState } from "react";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useRealtimePrayerTimes } from "@/hooks/useRealtimePrayerTimes";
import { useTheme } from "@/hooks/useTheme";
import { formatTime } from "@/utils/timeFormatter";
import { PrayerTime } from "@/types/prayer";

/**
 * Prayer Times Screen Component
 * Shows all 5 daily prayers with countdown to next prayer
 * Minimal, clean design optimized for mobile side panel
 */
export function PrayerTimesScreen() {
	const { prayerTimes, dateInfo, isLoading, error } = usePrayerTimes();
	const { next, previous, progress } = useRealtimePrayerTimes({
		prayerTimes,
		enabled: prayerTimes.length > 0,
		checkInterval: 10000, // Check every 10 seconds
	});
	const { theme } = useTheme();
	const [countdown, setCountdown] = useState<string>("");

	// Calculate countdown timer
	useEffect(() => {
		if (!next) return;

		const updateCountdown = () => {
			const now = new Date();
			const nextPrayerTime =
				next.timestamp instanceof Date
					? next.timestamp
					: new Date(next.timestamp);
			const diff = nextPrayerTime.getTime() - now.getTime();

			if (diff <= 0) {
				setCountdown("Now");
				return;
			}

			const hours = Math.floor(diff / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((diff % (1000 * 60)) / 1000);

			if (hours > 0) {
				setCountdown(`${hours}h ${minutes}m`);
			} else {
				setCountdown(`${minutes}m ${seconds}s`);
			}
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		return () => clearInterval(interval);
	}, [next]);

	if (isLoading) {
		return (
			<div className="prayer-times-screen">
				<div className="skeleton-loader skeleton-header" />
				<div className="skeleton-loader skeleton-card" />
				<div className="skeleton-loader skeleton-card" />
				<div className="skeleton-loader skeleton-card" />
			</div>
		);
	}

	if (error || prayerTimes.length === 0) {
		return (
			<div className="prayer-times-screen error">
				<p className="error-message">Unable to load prayer times</p>
			</div>
		);
	}

	const prayerOrder = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
	const orderedPrayers = prayerOrder
		.map((name) => prayerTimes.find((p) => p.name === name))
		.filter(Boolean) as PrayerTime[];

	return (
		<div className="prayer-times-screen">
			{/* Header with Date Info */}
			<div className="flex justify-center items-center text-xl h-full ">
				<h2 className="prayer-date">
					{dateInfo?.weekday}, {dateInfo?.day} {dateInfo?.month}
				</h2>
			</div>

			{/* Next Prayer Highlight Card */}
			{next && (
				<div className="rounded-l-xl rounded-r-xl shadow text-center justify-center items-center bg-linear-to-br from-(--color-primary-gold) to-(--color-primary-gold-dark) h-full">
					{/* <div className="text-base font-mono">Next Prayer</div> */}
					<div className="next-prayer-name text-shadow-xs text-shadow-neutral-600">{next.name}</div>
					<div className="next-prayer-time">{formatTime(next.time)}</div>
					<div className="next-prayer-countdown">{countdown}</div>

					{/* Progress Bar */}
					<div className="prayer-progress-bar dark:bg-white bg-black"></div>
				</div>
			)}

			{/* All Prayer Times List */}
			<div className="prayer-times-list">
				<h3 className="list-title">Daily Prayers</h3>
				{orderedPrayers.map((prayer) => {
					const isNext = next?.name === prayer.name;
					const isPrevious = previous?.name === prayer.name;

					return (
						<div
							key={prayer.name}
							className={`prayer-item ${isNext ? "is-next" : ""} ${isPrevious ? "is-previous" : ""}`}
						>
							<span className="prayer-name">{prayer.name}</span>
							<span className="prayer-time">{formatTime(prayer.time)}</span>
							{isNext && <span className="prayer-badge">Next</span>}
							{isPrevious && (
								<span className="prayer-badge completed">Done</span>
							)}
						</div>
					);
				})}
			</div>

			{/* Current/Previous Prayer Info */}
			{previous && (
				<div className="previous-prayer-info">
					<p className="info-label">Completed: {previous.name}</p>
				</div>
			)}
		</div>
	);
}
