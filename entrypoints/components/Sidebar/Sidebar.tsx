import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { listenForThemeChanges, applyThemeToDOM } from "@/utils/themeManager";
import { ThemeToggle } from "./shared/ThemeToggle";
import { TabNavigation, TabId } from "./TabNavigation";
import { SlideTransition } from "./SlideTransition";
import { useSwipeHandler } from "@/hooks/useSwipeHandler";
import { PrayerTimesScreen } from "./screens/PrayerTimesScreen";
import { AzkarScreen } from "./screens/AzkarScreen";
import "./Sidebar.css";

/**
 * Main Sidebar Component
 *
 * Mobile-app style side panel with:
 * - Tab-based navigation (Prayer Times & Azkar)
 * - Smooth slide animations
 * - Swipe gesture support
 * - Theme syncing across extension
 */
export function Sidebar() {
	const { theme, setTheme } = useTheme();
	const [activeTab, setActiveTab] = useState<TabId>("prayers");
	const containerRef = useRef<HTMLDivElement>(null);

	// Listen for theme changes from other contexts (e.g., settings page)
	useEffect(() => {
		const unsubscribe = listenForThemeChanges((newTheme) => {
			applyThemeToDOM(newTheme);
		}, "settings");

		return unsubscribe;
	}, []);

	// Listen for message-based theme changes
	useEffect(() => {
		const handleMessage = (message: any, sender: any, sendResponse: any) => {
			if (message.type === "THEME_CHANGED") {
				setTheme(message.payload.theme).catch(console.error);
			}
		};

		browser.runtime.onMessage.addListener(handleMessage);
		return () => browser.runtime.onMessage.removeListener(handleMessage);
	}, [setTheme]);

	// Handle swipe gestures for tab switching
	useSwipeHandler(containerRef, {
		onSwipeLeft: () => setActiveTab("azkar"), // Swipe left = next tab
		onSwipeRight: () => setActiveTab("prayers"), // Swipe right = previous tab
		threshold: 50,
		enabled: true,
	});

	const tabs: Array<{ id: TabId; label: string; icon: string }> = [
		{ id: "prayers", label: "Prayers", icon: "🕌" },
		{ id: "azkar", label: "Azkar", icon: "📿" },
	];

	// Determine slide direction based on tab change
	const getSlideDirection = (tabId: TabId): "left" | "right" => {
		const tabIndex = tabs.findIndex((t) => t.id === tabId);
		const activeIndex = tabs.findIndex((t) => t.id === activeTab);
		return tabIndex > activeIndex ? "left" : "right";
	};

	return (
		<div
			className={`sidebar-container ${theme}`}
			ref={containerRef}
			role="main"
		>
			{/* Header */}
			<header>
				{/* <ThemeToggle theme={theme} onToggle={setTheme} /> */}
			</header>

			{/* Main Content with Tab Screens */}
			<main className="sidebar-main">
				<SlideTransition
					isActive={activeTab === "prayers"}
					direction={getSlideDirection("prayers")}
					animationDuration={300}
				>
					<PrayerTimesScreen />
				</SlideTransition>

				<SlideTransition
					isActive={activeTab === "azkar"}
					direction={getSlideDirection("azkar")}
					animationDuration={300}
				>
					<AzkarScreen />
				</SlideTransition>
			</main>

			{/* Bottom Tab Navigation */}
			<TabNavigation
				tabs={tabs}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>
		</div>
	);
}
