export default function PopupSkeleton() {
	return (
		<div className="min-w-75 min-h-50 bg-dark-bg text-text-light font-sans">
			<div className="flex flex-col min-[400px]:flex-row min-[400px]:items-stretch">
				{/* Date Skeleton */}
				<div className="relative p-2">
					<div className="bg-primary-dark animate-pulse bg-linear-180 from-offwhite-medium to-offwhite-transparent shadow-lg text-black text-center py-4 rounded-date flex flex-col justify-center min-w-25">
						<div className="h-22 mb-2"></div>
					</div>
				</div>

				{/* Prayer Skeleton */}
				<div className="p-4 bg-dark-surface bg-linear-180 from-offwhite-light to-dark-surface shadow-[0_2px_10px_rgba(0,0,0,0.1)] flex-1">
					{/* Prayer Titles Skeleton */}
					<div className="flex justify-between items-center pb-2 gap-4">
						<div className="h-6 bg-offwhite-medium rounded animate-pulse flex-1"></div>
						<div className="h-6 bg-offwhite-medium rounded animate-pulse flex-1"></div>
					</div>

					{/* Progress Bar Skeleton */}
					<div className="py-3">
						<div className="h-6 bg-offwhite-medium rounded-progress animate-pulse"></div>
					</div>

					{/* Prayer Times Skeleton */}
					<div className="pt-2 flex justify-between items-center gap-4">
						<div className="h-6 bg-offwhite-medium rounded animate-pulse flex-1"></div>
						<div className="h-6 bg-offwhite-medium rounded animate-pulse flex-1"></div>
					</div>
				</div>
			</div>
		</div>
	);
}
