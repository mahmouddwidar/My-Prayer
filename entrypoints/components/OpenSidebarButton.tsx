import React, { memo, useCallback } from "react";

interface OpenSidebarButtonProps {
	className?: string;
	label?: string;
	windowWidth?: number;
	windowHeight?: number;
}

/**
 * Open Sidebar Button Component
 * Opens sidebar in a new window or panel
 *
 * Usage:
 * ```tsx
 * import { OpenSidebarButton } from '@/components/OpenSidebarButton';
 *
 * export function MyComponent() {
 *   return <OpenSidebarButton label="📖 Open Sidebar" />;
 * }
 * ```
 */
export const OpenSidebarButton = memo(function OpenSidebarButton({
	className = "",
	label = "📖 Open Sidebar",
	windowWidth = 380,
	windowHeight = 600,
}: OpenSidebarButtonProps) {
	const handleOpenSidebar = useCallback(() => {
		try {
			// Option 1: Open in new popup window (Universal)
			chrome.windows.create({
				url: chrome.runtime.getURL("sidebar.html"),
				type: "popup",
				width: windowWidth,
				height: windowHeight,
			});

			// Option 2: If using Chrome 114+ with sidePanel
			// Uncomment to use side panel instead:
			// chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			//   if (tabs[0]?.id) {
			//     chrome.sidePanel.open({ tabId: tabs[0].id });
			//   }
			// });
		} catch (error) {
			console.error("Failed to open sidebar:", error);
			// Fallback: Open in new tab
			chrome.tabs.create({
				url: chrome.runtime.getURL("sidebar.html"),
			});
		}
	}, [windowWidth, windowHeight]);

	return (
		<button
			onClick={handleOpenSidebar}
			className={`open-sidebar-button ${className}`}
			title="Open the prayer sidebar"
			aria-label="Open sidebar"
		>
			{label}
		</button>
	);
});

OpenSidebarButton.displayName = "OpenSidebarButton";
