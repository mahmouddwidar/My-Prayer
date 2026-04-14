import React, { memo } from "react";
import { PrayerTime } from "@/types/prayer";
import { convertTo12HourFormat } from "@/utils/timeFormatter";

interface PrayerItemProps {
	prayer: PrayerTime;
	isHighlighted: boolean;
	isPrevious?: boolean;
	progress?: number; // 0-100
}

/**
 * Prayer Item Component
 * Displays individual prayer with time
 * Highlights current/next prayer
 * Memoized for performance
 */
export const PrayerItem = memo(
	function PrayerItem({
		prayer,
		isHighlighted,
		isPrevious,
		progress,
	}: PrayerItemProps) {
		return (
			<div
				className={`prayer-item ${isHighlighted ? "highlighted" : ""} ${
					isPrevious ? "past" : ""
				}`}
			>
				<div className="prayer-info">
					<span className="prayer-name">{prayer.name}</span>
					{prayer.arabicName && (
						<span className="prayer-arabic">{prayer.arabicName}</span>
					)}
				</div>

				<span className="prayer-time">
					{convertTo12HourFormat(prayer.time)}
				</span>

				{isHighlighted && progress !== undefined && (
					<div className="prayer-progress">
						<div className="progress-bar">
							<div
								className="progress-fill"
								style={{ width: `${progress}%` }}
							/>
						</div>
						<span className="progress-percent">{Math.round(progress)}%</span>
					</div>
				)}
			</div>
		);
	},
	(prevProps, nextProps) => {
		// Only re-render if these props change
		return (
			prevProps.prayer.name === nextProps.prayer.name &&
			prevProps.isHighlighted === nextProps.isHighlighted &&
			prevProps.progress === nextProps.progress
		);
	},
);

PrayerItem.displayName = "PrayerItem";
