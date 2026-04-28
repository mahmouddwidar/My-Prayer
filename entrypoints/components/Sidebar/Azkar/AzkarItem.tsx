import React, { memo } from "react";
import { AzkarCounter } from "../Azkar/AzkarCounter";

interface AzkarItemData {
	id: string;
	subtitle?: string;
	text: string;
	fadl?: string;
	count: number;
}

interface AzkarItemProps {
	azkar: AzkarItemData;
	currentCount: number;
	originalCount: number;
	onIncrement: () => void;
	onReset: () => void;
	counterId: string;
}

/**
 * Individual Azkar Item Component
 * Displays azkar text with interactive counter
 * Memoized to prevent unnecessary re-renders
 */
export const AzkarItem = memo(
	function AzkarItem({
		azkar,
		currentCount,
		originalCount,
		onIncrement,
		onReset,
		counterId,
	}: AzkarItemProps) {
		const isCompleted = currentCount === 0;

		return (
			<div className={`azkar-item ${isCompleted ? "completed" : ""}`}>
				{azkar.subtitle && <p className="azkar-subtitle text-base">{azkar.subtitle}</p>}

				<p className="azkar-text text-3xl" dir="rtl">
					{azkar.text}
				</p>

				{azkar.fadl && <p className="azkar-fadl">{azkar.fadl}</p>}

				<AzkarCounter
					counterId={counterId}
					currentCount={currentCount}
					originalCount={originalCount}
					onIncrement={onIncrement}
					onReset={onReset}
					isCompleted={isCompleted}
				/>
			</div>
		);
	},
	(prevProps, nextProps) => {
		// Custom comparison for memo
		return (
			prevProps.currentCount === nextProps.currentCount &&
			prevProps.counterId === nextProps.counterId &&
			prevProps.azkar.id === nextProps.azkar.id
		);
	},
);

AzkarItem.displayName = "AzkarItem";
