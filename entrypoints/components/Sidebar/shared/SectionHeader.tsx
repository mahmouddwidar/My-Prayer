import React, { memo } from "react";

interface SectionHeaderProps {
	title: string;
	icon: string;
	isExpanded: boolean;
	onToggle: () => void;
}

/**
 * Reusable Section Header Component
 * Handles collapse/expand with toggle button
 */
export const SectionHeader = memo(function SectionHeader({
	title,
	icon,
	isExpanded,
	onToggle,
}: SectionHeaderProps) {
	return (
		<div className="section-header">
			<div className="header-left">
				<span className="header-icon">{icon}</span>
				<h2 className="header-title">{title}</h2>
			</div>

			<button
				className={`toggle-button ${isExpanded ? "expanded" : ""}`}
				onClick={onToggle}
				aria-expanded={isExpanded}
				aria-label={`Toggle ${title}`}
			>
				<span className="toggle-icon">▼</span>
			</button>
		</div>
	);
});

SectionHeader.displayName = "SectionHeader";
