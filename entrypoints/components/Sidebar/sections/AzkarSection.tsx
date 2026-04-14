import React, { useState, useMemo } from "react";
import { useAzkarCounters } from "@/hooks/useAzkarCounters";
import { useTheme } from "@/hooks/useTheme";
import { SectionHeader } from "../shared/SectionHeader";
import { AzkarItem } from "../Azkar/AzkarItem";
import { azkarData } from "@/utils/azkarContent";

interface AzkarSectionProps {
	isExpanded: boolean;
	onToggle: () => void;
}

type TabType = "morning" | "evening";

/**
 * Azkar Section Component
 * Displays morning and evening Azkar with interactive counters
 */
export function AzkarSection({ isExpanded, onToggle }: AzkarSectionProps) {
	const [activeTab, setActiveTab] = useState<TabType>("morning");
	const { counters, increment, reset, resetAll } = useAzkarCounters();
	const { theme } = useTheme();

	// Get azkar for active tab
	const activeAzkarItems = useMemo(() => {
		return azkarData[activeTab] || [];
	}, [activeTab]);

	// Ensure counters are initialized for all azkar items
	React.useEffect(() => {
		activeAzkarItems.forEach((azkar) => {
			if (!counters.has(azkar.id)) {
				// Initialize counter in storage
				const azkarKey = `${activeTab}_${azkar.id}`;
				if (!counters.has(azkarKey)) {
					// This will be created on first increment
				}
			}
		});
	}, [activeAzkarItems, counters, activeTab]);

	const getCounterId = (azkarId: string) => `${activeTab}_${azkarId}`;

	return (
		<div className="section azkar-section">
			<SectionHeader
				title="Azkar"
				icon="📿"
				isExpanded={isExpanded}
				onToggle={onToggle}
			/>

			{isExpanded && (
				<div className="section-content">
					{/* Tabs */}
					<div className="azkar-tabs-header">
						<button
							className={`tab-button ${activeTab === "morning" ? "active" : ""}`}
							onClick={() => setActiveTab("morning")}
						>
							🌅 Morning
						</button>
						<button
							className={`tab-button ${activeTab === "evening" ? "active" : ""}`}
							onClick={() => setActiveTab("evening")}
						>
							🌙 Evening
						</button>
					</div>

					{/* Reset All Button */}
					<button
						className="reset-all-button"
						onClick={resetAll}
						title="Reset all counters to original values"
					>
						↻ Reset All
					</button>

					{/* Azkar Items */}
					<div className="azkar-items">
						{activeAzkarItems.length === 0 ? (
							<div className="no-azkar">No azkar available</div>
						) : (
							activeAzkarItems.map((azkar, index) => {
								const counterId = getCounterId(azkar.id);
								const counter = counters.get(counterId);
								const currentCount = counter?.currentCount ?? azkar.count;
								const originalCount = azkar.count;

								return (
									<AzkarItem
										key={`${activeTab}-${index}`}
										azkar={azkar}
										currentCount={currentCount}
										originalCount={originalCount}
										onIncrement={() => increment(counterId)}
										onReset={() => reset(counterId)}
										counterId={counterId}
									/>
								);
							})
						)}
					</div>
				</div>
			)}
		</div>
	);
}
