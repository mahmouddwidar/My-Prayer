import React, { memo } from "react";
import { ThemeType } from "@/utils/themeManager";

interface ThemeToggleProps {
	theme: ThemeType;
	onToggle: (theme: ThemeType) => Promise<void>;
}

/**
 * Theme Toggle Button Component
 * Switches between light and dark mode
 * Updates theme globally across extension
 */
export const ThemeToggle = memo(function ThemeToggle({
	theme,
	onToggle,
}: ThemeToggleProps) {
	const handleToggle = async () => {
		const newTheme = theme === "light" ? "dark" : "light";
		await onToggle(newTheme);

		// Optionally send message to other contexts
		try {
			chrome.runtime
				.sendMessage({
					type: "THEME_CHANGED",
					payload: { theme: newTheme },
				})
				.catch(() => {
					// Ignore errors if no listener
				});
		} catch (err) {
			console.error("Failed to send theme change message:", err);
		}
	};

	return (
		<button
			className="theme-toggle"
			onClick={handleToggle}
			aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
			title={`Current: ${theme} mode`}
		>
			{theme === "light" ? "🌙" : "☀️"}
		</button>
	);
});

ThemeToggle.displayName = "ThemeToggle";
