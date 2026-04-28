import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAzkarCounters } from "@/hooks/useAzkarCounters";
import { useTheme } from "@/hooks/useTheme";
import { azkarData } from "@/utils/azkarContent";
import { AzkarItem } from "../Azkar/AzkarItem";

type AzkarType = "morning" | "evening";

/**
 * Azkar Screen Component
 * Shows Morning and Evening Azkar with interactive counters
 * Mobile-optimized with smooth scroll and completion animations
 */
export function AzkarScreen() {
	const [activeTab, setActiveTab] = useState<AzkarType>("morning");
	const { counters, increment, reset } = useAzkarCounters();
	const { theme } = useTheme();
	const [showScrollTop, setShowScrollTop] = useState(false);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Get azkar for active tab
	const activeAzkarItems = useMemo(() => {
		return azkarData[activeTab] || [];
	}, [activeTab]);

	// Track scroll position for "back to top" button
	const handleScroll = () => {
		if (scrollContainerRef.current) {
			setShowScrollTop(scrollContainerRef.current.scrollTop > 200);
		}
	};

	const scrollToTop = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		}
	};

	// Calculate completion percentage
	const completionPercent = useMemo(() => {
		if (activeAzkarItems.length === 0) return 0;

		const completedCount = activeAzkarItems.filter((azkar) => {
			const counterId = `${activeTab}_${azkar.id}`;
			const count = counters.get(counterId) || azkar.count;
			return count === 0;
		}).length;

		return Math.round((completedCount / activeAzkarItems.length) * 100);
	}, [activeAzkarItems, activeTab, counters]);

	return (
		<div className="azkar-screen">
			{/* Tab Switcher */}
			<div className="azkar-tabs">
				<button
					className={`azkar-tab-button ${activeTab === "morning" ? "active" : ""}`}
					onClick={() => setActiveTab("morning")}
					role="tab"
					aria-selected={activeTab === "morning"}
				>
					🌅 Morning
				</button>
				<button
					className={`azkar-tab-button ${activeTab === "evening" ? "active" : ""}`}
					onClick={() => setActiveTab("evening")}
					role="tab"
					aria-selected={activeTab === "evening"}
				>
					🌙 Evening
				</button>
			</div>

			{/* Completion Progress */}
			<div className="azkar-progress-section">
				<div className="progress-label">
					<span className="progress-text">Progress</span>
					<span className="progress-percent">{completionPercent}%</span>
				</div>
				<div className="progress-bar-container">
					<div
						className="progress-bar-fill"
						style={{
							width: `${completionPercent}%`,
							transition: "width 0.3s ease-out",
						}}
					/>
				</div>
			</div>

			{/* Azkar Items Container */}
			<div
				className="azkar-items-container"
				ref={scrollContainerRef}
				onScroll={handleScroll}
			>
				{activeAzkarItems.length > 0 ? (
					<div className="azkar-items-list">
						{activeAzkarItems.map((azkar) => {
							const counterId = `${activeTab}_${azkar.id}`;
							const currentCount = counters.get(counterId) || azkar.count;
							const originalCount = azkar.count;

							return (
								<AzkarItem
									key={azkar.id}
									azkar={{
										...azkar,
										count: originalCount,
									}}
									currentCount={currentCount}
									originalCount={originalCount}
									onIncrement={() => increment(counterId)}
									onReset={() => reset(counterId, originalCount)}
									counterId={counterId}
								/>
							);
						})}
					</div>
				) : (
					<div className="azkar-empty">
						<p>No azkar available for this time</p>
					</div>
				)}
			</div>

			{/* Scroll to Top Button */}
			{showScrollTop && (
				<button
					className="scroll-to-top-button"
					onClick={scrollToTop}
					title="Scroll to top"
					aria-label="Scroll to top"
				>
					↑
				</button>
			)}

			{/* Completion Celebration */}
			{completionPercent === 100 && activeAzkarItems.length > 0 && (
				<div className="completion-celebration">
					<div className="celebration-emoji">✨</div>
					<p className="celebration-text">All {activeTab} azkar completed!</p>
				</div>
			)}
		</div>
	);
}
