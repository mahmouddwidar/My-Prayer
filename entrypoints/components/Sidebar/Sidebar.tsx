import React, { useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { listenForThemeChanges, applyThemeToDOM } from "@/utils/themeManager";
import { useSectionState } from "@/hooks/useSectionState";
import { PrayerSection } from "./sections/PrayerSection";
import { AzkarSection } from "./sections/AzkarSection";
import { ThemeToggle } from "./shared/ThemeToggle";
import "./Sidebar.css";

/**
 * Main Sidebar Component
 *
 * Manages:
 * - Theme syncing across extension
 * - Section state (expanded/collapsed)
 * - Prayer highlighting
 * - Azkar counter state
 */
export function Sidebar() {
	const { theme, setTheme } = useTheme();
	const { isExpanded, toggleSection } = useSectionState();

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

		chrome.runtime.onMessage.addListener(handleMessage);
		return () => chrome.runtime.onMessage.removeListener(handleMessage);
	}, [setTheme]);

	return (
		<div className={`sidebar-container ${theme}`}>
			{/* Header */}
			<header className="sidebar-header">
				<div className="header-content">
					<h1 className="sidebar-title">My Prayer</h1>
					<p className="sidebar-subtitle">Daily Prayers & Azkar</p>
				</div>
				<ThemeToggle theme={theme} onToggle={setTheme} />
			</header>

			{/* Main Content */}
			<main className="sidebar-main">
				<PrayerSection
					isExpanded={isExpanded("prayerTimesHeader")}
					onToggle={() => toggleSection("prayerTimesHeader")}
				/>

				<AzkarSection
					isExpanded={isExpanded("azkarHeader")}
					onToggle={() => toggleSection("azkarHeader")}
				/>
			</main>

			{/* Footer */}
			<footer className="sidebar-footer">
				<a
					href="https://github.com/mahmouddwidar/My-Prayer"
					target="_blank"
					rel="noopener noreferrer"
					className="footer-link"
				>
					🔗 Contribute on GitHub
				</a>
			</footer>
		</div>
	);
}
