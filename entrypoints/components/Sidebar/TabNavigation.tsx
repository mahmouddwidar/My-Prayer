import React, { memo } from "react";

export type TabId = "prayers" | "azkar";

interface Tab {
	id: TabId;
	label: string;
	icon: string;
}

interface TabNavigationProps {
	tabs: Tab[];
	activeTab: TabId;
	onTabChange: (tabId: TabId) => void;
}

/**
 * Bottom Tab Navigation Component
 * Mobile-app style tab bar for switching between Prayer Times and Azkar
 */
export const TabNavigation = memo(function TabNavigation({
	tabs,
	activeTab,
	onTabChange,
}: TabNavigationProps) {
	return (
		<nav className="tab-navigation" role="tablist">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
					onClick={() => onTabChange(tab.id)}
					role="tab"
					aria-selected={activeTab === tab.id}
					aria-controls={`${tab.id}-panel`}
					title={tab.label}
				>
					<span className="tab-icon">{tab.icon}</span>
					<span className="tab-label">{tab.label}</span>
				</button>
			))}
		</nav>
	);
});

TabNavigation.displayName = "TabNavigation";
