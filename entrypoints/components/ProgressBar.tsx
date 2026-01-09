import { usePrayerProgress } from "@/hooks/usePrayerProgress";

interface ProgressBarProps {
	previousPrayerTime: Date;
	nextPrayerTime: Date;
	showLabels?: boolean;
	className?: string;
}

export default function ProgressBar({
	previousPrayerTime,
	nextPrayerTime,
	className = "",
}: ProgressBarProps) {
	const { progress, timeRemaining, isLoading } = usePrayerProgress({
		previousPrayerTime,
		nextPrayerTime,
	});

	if (isLoading) {
		return (
			<div className="w-full h-6 bg-[rgba(0,0,0,0.25)] rounded-[0.75rem] animate-pulse" />
		);
	}
	return (
		<div className={`space-y-2 ${className}`}>
			{/* Progress bar container */}
			<div
				className="w-full h-6 bg-[rgba(0,0,0,0.25)] rounded-[0.75rem] shadow-inner-progress overflow-hidden relative"
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={progress}
				aria-label={`${progress.toFixed(1)}% progress towards next prayer`}
			>
				{/* Progress fill with animation */}
				<div
					className="h-full min-w-fit bg-linear-to-r from-offwhite-55 to-offwhite-96 rounded-[0.75rem] shadow-progress-bar transition-all duration-500 ease-out relative"
					style={{ width: `${progress}%` }}
				>
					{/* Animated shine effect */}
					<div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer opacity-0 hover:opacity-100 transition-opacity duration-300" />

					{/* Text inside progress bar */}
					<div className="relative min-w-fit z-10 h-full flex items-center justify-center px-2">
						<span className="text-black text-xs tracking-wide font-bold whitespace-nowrap">
							{timeRemaining}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
