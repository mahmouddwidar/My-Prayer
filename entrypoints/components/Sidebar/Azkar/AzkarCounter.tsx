import React, { memo } from "react";

interface AzkarCounterProps {
	counterId: string;
	currentCount: number;
	originalCount: number;
	onIncrement: () => void;
	onReset: () => void;
	isCompleted: boolean;
}

/**
 * Azkar Counter Component
 * Displays count and provides increment/reset controls
 * Memoized for performance
 */
export const AzkarCounter = memo(
	function AzkarCounter({
		counterId,
		currentCount,
		originalCount,
		onIncrement,
		onReset,
		isCompleted,
	}: AzkarCounterProps) {
		return (
			<div className={`azkar-counter ${isCompleted ? "completed" : ""}`}>
				<div className="counter-display">
					<span className="current-count">{currentCount}</span>
					<span className="count-separator">/</span>
					<span className="total-count">{originalCount}</span>
				</div>

				<div className="counter-buttons">
					{/* Increment Button */}
					<button
						className="counter-button increment-btn"
						onClick={onIncrement}
						disabled={isCompleted}
						aria-label={`Increment counter for ${counterId}`}
						title={isCompleted ? "Completed" : "Click to decrement"}
					>
						−
					</button>

					{/* Reset Button */}
					<button
						className="counter-button reset-btn"
						onClick={onReset}
						disabled={currentCount === originalCount}
						aria-label={`Reset counter for ${counterId}`}
						title="Reset to original count"
					>
						↻
					</button>
				</div>

				{isCompleted && (
					<div className="completion-badge" title="Completed!">
						✓
					</div>
				)}
			</div>
		);
	},
	(prevProps, nextProps) => {
		// Only re-render if these props change
		return (
			prevProps.currentCount === nextProps.currentCount &&
			prevProps.isCompleted === nextProps.isCompleted &&
			prevProps.counterId === nextProps.counterId
		);
	},
);

AzkarCounter.displayName = "AzkarCounter";
