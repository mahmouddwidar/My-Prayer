import React, { useMemo } from "react";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useRealtimePrayerTimes } from "@/hooks/useRealtimePrayerTimes";
import { PrayerItem } from "../PrayerList/PrayerItem";
import { SectionHeader } from "../shared/SectionHeader";
import { useTheme } from "@/hooks/useTheme";

interface PrayerSectionProps {
	isExpanded: boolean;
	onToggle: () => void;
}

/**
 * Prayer Times Section Component
 * Displays daily prayer times with current/next prayer highlighting
 */
export function PrayerSection({ isExpanded, onToggle }: PrayerSectionProps) {
	const { prayerTimes, isLoading, error } = usePrayerTimes();
	const { next, previous, progress } = useRealtimePrayerTimes({
		prayerTimes,
		enabled: prayerTimes.length > 0,
		checkInterval: 60000, // Check every minute
	});
	const { theme } = useTheme();

	// Memoize styled prayer items to prevent unnecessary re-renders
	const styledPrayerItems = useMemo(() => {
		return prayerTimes.map((prayer) => ({
			...prayer,
			isNext: next?.name === prayer.name,
			isPrevious: previous?.name === prayer.name,
			isCurrent: next?.name === prayer.name, // Highlight next prayer
		}));
	}, [prayerTimes, next, previous]);

	if (isLoading) {
		return (
			<div className="section prayer-section">
				<SectionHeader
					title="Prayer Times"
					icon="🕌"
					isExpanded={isExpanded}
					onToggle={onToggle}
				/>
				<div className="section-content loading">
					<div className="skeleton-loader" />
					<div className="skeleton-loader" />
					<div className="skeleton-loader" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="section prayer-section">
				<SectionHeader
					title="Prayer Times"
					icon="🕌"
					isExpanded={isExpanded}
					onToggle={onToggle}
				/>
				<div className="section-content error">
					<p>Error loading prayer times</p>
				</div>
			</div>
		);
	}

	return (
		<div className="section prayer-section">
			<SectionHeader
				title="Prayer Times"
				icon="🕌"
				isExpanded={isExpanded}
				onToggle={onToggle}
			/>

			{isExpanded && (
				<div className="section-content">
					<div className="prayer-list">
						{styledPrayerItems.map((prayer) => (
							<PrayerItem
								key={prayer.name}
								prayer={prayer}
								isHighlighted={prayer.isCurrent}
								isPrevious={prayer.isPrevious}
								progress={prayer.isCurrent ? progress : undefined}
							/>
						))}
					</div>

					{next && (
						<div className="prayer-info">
							<p className="next-prayer-label">
								Next Prayer: <strong>{next.name}</strong>
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
